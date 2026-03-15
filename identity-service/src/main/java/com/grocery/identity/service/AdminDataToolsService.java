package com.grocery.identity.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.grocery.common.api.DomainException;
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.sql.*;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import java.util.zip.ZipOutputStream;

@Service
public class AdminDataToolsService {
    private static final DateTimeFormatter FILE_TS = DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss").withZone(ZoneOffset.UTC);
    private static final String BACKUP_JSON = "backup.json";

    private final ObjectMapper objectMapper;
    private final String dbUsername;
    private final String dbPassword;
    private final List<DbSpec> dbSpecs;

    public AdminDataToolsService(ObjectMapper objectMapper,
                                 @Value("${app.admin-tools.db-username}") String dbUsername,
                                 @Value("${app.admin-tools.db-password}") String dbPassword,
                                 @Value("${app.admin-tools.identity-db-url}") String identityDbUrl,
                                 @Value("${app.admin-tools.catalog-db-url}") String catalogDbUrl,
                                 @Value("${app.admin-tools.inventory-db-url}") String inventoryDbUrl,
                                 @Value("${app.admin-tools.cart-db-url}") String cartDbUrl,
                                 @Value("${app.admin-tools.order-db-url}") String orderDbUrl,
                                 @Value("${app.admin-tools.payment-db-url}") String paymentDbUrl) {
        this.objectMapper = objectMapper;
        this.dbUsername = dbUsername;
        this.dbPassword = dbPassword;
        this.dbSpecs = List.of(
                new DbSpec("identity", identityDbUrl, List.of("users", "addresses")),
                new DbSpec("catalog", catalogDbUrl, List.of("categories", "subcategories", "products")),
                new DbSpec("inventory", inventoryDbUrl, List.of("inventory", "stock_reservations")),
                new DbSpec("cart", cartDbUrl, List.of("cart_items")),
                new DbSpec("orders", orderDbUrl, List.of("orders", "order_items", "order_delivery_address")),
                new DbSpec("payments", paymentDbUrl, List.of("payments", "payment_account_settings"))
        );
    }

    public DownloadPayload generateBackupZip() {
        try {
            BackupPayload payload = new BackupPayload(1, Instant.now(), new ArrayList<>());
            for (DbSpec dbSpec : dbSpecs) {
                payload.databases().add(readDatabase(dbSpec));
            }
            byte[] json = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsBytes(payload);
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            try (ZipOutputStream zip = new ZipOutputStream(baos, StandardCharsets.UTF_8)) {
                zip.putNextEntry(new ZipEntry(BACKUP_JSON));
                zip.write(json);
                zip.closeEntry();
            }
            return new DownloadPayload(
                    "backup-" + FILE_TS.format(Instant.now()) + ".zip",
                    "application/zip",
                    baos.toByteArray()
            );
        } catch (Exception ex) {
            throw new DomainException("BACKUP_FAILED", "Unable to create backup zip");
        }
    }

    public void restoreBackup(MultipartFile file) {
        try {
            BackupPayload payload = readBackupPayload(file);
            for (DbSpec dbSpec : dbSpecs) {
                DatabaseBackup databaseBackup = payload.databases().stream()
                        .filter(db -> db.name().equals(dbSpec.name()))
                        .findFirst()
                        .orElseThrow(() -> new DomainException("BACKUP_INVALID", "Missing database section: " + dbSpec.name()));
                restoreDatabase(dbSpec, databaseBackup);
            }
        } catch (IOException ex) {
            throw new DomainException("BACKUP_INVALID", "Unable to read backup zip");
        } catch (SQLException ex) {
            throw new DomainException("BACKUP_RESTORE_FAILED", "Unable to restore backup data");
        }
    }

    public void cleanAppDataExceptAdmins() {
        for (DbSpec dbSpec : dbSpecs) {
            try (Connection connection = open(dbSpec.url())) {
                connection.setAutoCommit(false);
                if ("identity".equals(dbSpec.name())) {
                    cleanIdentity(connection);
                } else {
                    execute(connection, "SET session_replication_role = replica");
                    truncateTables(connection, dbSpec.tables());
                    execute(connection, "SET session_replication_role = DEFAULT");
                }
                connection.commit();
            } catch (Exception ex) {
                throw new DomainException("CLEANUP_FAILED", "Unable to clean app data");
            }
        }
    }

    public DownloadPayload generateOrderReport(String format) {
        List<Map<String, Object>> rows = query("""
                SELECT order_ref,
                       user_email,
                       COALESCE(user_phone, '') AS user_phone,
                       payment_method,
                       status,
                       COALESCE(rejection_comment, '') AS rejection_comment,
                       total_amount,
                       created_at
                FROM orders
                ORDER BY created_at DESC
                """, db("orders"));
        return reportPayload("orders-report", format, List.of(
                "Order Ref", "User Email", "Phone", "Payment Method", "Status", "Rejection Comment", "Total Amount", "Created At"
        ), rows.stream().map(row -> List.of(
                text(row.get("order_ref")),
                text(row.get("user_email")),
                text(row.get("user_phone")),
                text(row.get("payment_method")),
                text(row.get("status")),
                text(row.get("rejection_comment")),
                text(row.get("total_amount")),
                text(row.get("created_at"))
        )).toList(), "Orders Report");
    }

    public DownloadPayload generateInventoryReport(String format) {
        List<Map<String, Object>> rows = query("""
                SELECT sku,
                       product_name,
                       total_qty,
                       reserved_qty,
                       total_qty - reserved_qty AS available_qty,
                       reorder_threshold,
                       CASE WHEN total_qty - reserved_qty <= reorder_threshold THEN 0 ELSE 1 END AS low_stock_rank
                FROM inventory
                ORDER BY low_stock_rank ASC, available_qty ASC, product_name ASC
                """, db("inventory"));
        return reportPayload("inventory-report", format, List.of(
                "SKU", "Product Name", "Total Qty", "Reserved Qty", "Available Qty", "Threshold", "Low Stock"
        ), rows.stream().map(row -> List.of(
                text(row.get("sku")),
                text(row.get("product_name")),
                text(row.get("total_qty")),
                text(row.get("reserved_qty")),
                text(row.get("available_qty")),
                text(row.get("reorder_threshold")),
                lowStockLabel(row.get("available_qty"), row.get("reorder_threshold"))
        )).toList(), "Inventory Report");
    }

    private DatabaseBackup readDatabase(DbSpec dbSpec) throws SQLException {
        List<TableBackup> tables = new ArrayList<>();
        try (Connection connection = open(dbSpec.url())) {
            for (String table : dbSpec.tables()) {
                tables.add(new TableBackup(table, selectAll(connection, table)));
            }
        }
        return new DatabaseBackup(dbSpec.name(), tables);
    }

    private void restoreDatabase(DbSpec dbSpec, DatabaseBackup backup) throws SQLException {
        try (Connection connection = open(dbSpec.url())) {
            connection.setAutoCommit(false);
            execute(connection, "SET session_replication_role = replica");
            truncateTables(connection, dbSpec.tables());
            for (TableBackup table : backup.tables()) {
                insertRows(connection, table.table(), table.rows());
                resetIdentitySequenceIfPresent(connection, table.table());
            }
            execute(connection, "SET session_replication_role = DEFAULT");
            connection.commit();
        }
    }

    private void cleanIdentity(Connection connection) throws SQLException {
        List<Long> adminIds = new ArrayList<>();
        try (PreparedStatement ps = connection.prepareStatement("SELECT id FROM users WHERE UPPER(role) = 'ADMIN'");
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                adminIds.add(rs.getLong(1));
            }
        }

        execute(connection, "SET session_replication_role = replica");
        execute(connection, "DELETE FROM addresses WHERE user_id NOT IN (" + inClause(adminIds) + ")", adminIds);
        execute(connection, "UPDATE users SET default_address_id = NULL WHERE id NOT IN (" + inClause(adminIds) + ")", adminIds);
        execute(connection, "DELETE FROM users WHERE id NOT IN (" + inClause(adminIds) + ")", adminIds);
        execute(connection, "SET session_replication_role = DEFAULT");
    }

    private BackupPayload readBackupPayload(MultipartFile file) throws IOException {
        try (ZipInputStream zip = new ZipInputStream(new ByteArrayInputStream(file.getBytes()), StandardCharsets.UTF_8)) {
            ZipEntry entry;
            while ((entry = zip.getNextEntry()) != null) {
                if (BACKUP_JSON.equals(entry.getName())) {
                    return objectMapper.readValue(zip, BackupPayload.class);
                }
            }
        }
        throw new DomainException("BACKUP_INVALID", "backup.json not found in zip");
    }

    private List<Map<String, Object>> selectAll(Connection connection, String table) throws SQLException {
        try (PreparedStatement ps = connection.prepareStatement("SELECT * FROM " + table + " ORDER BY 1");
             ResultSet rs = ps.executeQuery()) {
            return resultSetToMaps(rs);
        }
    }

    private void insertRows(Connection connection, String table, List<Map<String, Object>> rows) throws SQLException {
        if (rows == null || rows.isEmpty()) {
            return;
        }
        List<String> columns = new ArrayList<>(rows.get(0).keySet());
        String sql = "INSERT INTO " + table + " (" + String.join(", ", columns) + ") VALUES (" +
                String.join(", ", Collections.nCopies(columns.size(), "?")) + ")";
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            for (Map<String, Object> row : rows) {
                for (int i = 0; i < columns.size(); i++) {
                    Object value = row.get(columns.get(i));
                    if (value instanceof Integer integer) {
                        ps.setInt(i + 1, integer);
                    } else if (value instanceof Long aLong) {
                        ps.setLong(i + 1, aLong);
                    } else if (value instanceof Double aDouble) {
                        ps.setDouble(i + 1, aDouble);
                    } else if (value instanceof Boolean aBoolean) {
                        ps.setBoolean(i + 1, aBoolean);
                    } else if (value instanceof BigDecimal decimal) {
                        ps.setBigDecimal(i + 1, decimal);
                    } else if (value instanceof Map || value instanceof List) {
                        ps.setObject(i + 1, objectMapper.writeValueAsString(value), Types.OTHER);
                    } else if (value == null) {
                        ps.setObject(i + 1, null);
                    } else {
                        ps.setObject(i + 1, value);
                    }
                }
                ps.addBatch();
            }
            ps.executeBatch();
        } catch (IOException ex) {
            throw new SQLException("Unable to serialize backup value", ex);
        }
    }

    private void truncateTables(Connection connection, List<String> tables) throws SQLException {
        for (String table : tables) {
            execute(connection, "TRUNCATE TABLE " + table + " RESTART IDENTITY CASCADE");
        }
    }

    private void resetIdentitySequenceIfPresent(Connection connection, String table) throws SQLException {
        String sql = """
                SELECT setval(pg_get_serial_sequence(?, 'id'),
                              COALESCE((SELECT MAX(id) FROM %s), 1),
                              COALESCE((SELECT MAX(id) FROM %s), 1) > 0)
                """.formatted(table, table);
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setString(1, table);
            ps.execute();
        } catch (SQLException ignored) {
        }
    }

    private List<Map<String, Object>> query(String sql, DbSpec dbSpec) {
        try (Connection connection = open(dbSpec.url());
             PreparedStatement ps = connection.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            return resultSetToMaps(rs);
        } catch (SQLException ex) {
            throw new DomainException("REPORT_FAILED", "Unable to generate report data");
        }
    }

    private List<Map<String, Object>> resultSetToMaps(ResultSet rs) throws SQLException {
        List<Map<String, Object>> rows = new ArrayList<>();
        ResultSetMetaData meta = rs.getMetaData();
        while (rs.next()) {
            Map<String, Object> row = new LinkedHashMap<>();
            for (int i = 1; i <= meta.getColumnCount(); i++) {
                row.put(meta.getColumnLabel(i), rs.getObject(i));
            }
            rows.add(row);
        }
        return rows;
    }

    private DownloadPayload reportPayload(String baseName, String format, List<String> headers, List<List<String>> rows, String title) {
        return switch (format.toLowerCase(Locale.ROOT)) {
            case "xlsx", "excel" -> new DownloadPayload(
                    baseName + "-" + LocalDate.now() + ".xlsx",
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    createExcel(headers, rows, title)
            );
            case "pdf" -> new DownloadPayload(
                    baseName + "-" + LocalDate.now() + ".pdf",
                    "application/pdf",
                    createPdf(headers, rows, title)
            );
            default -> throw new DomainException("INVALID_FORMAT", "Format must be pdf or xlsx");
        };
    }

    private byte[] createExcel(List<String> headers, List<List<String>> rows, String title) {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet(title);
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFont(headerFont);

            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.size(); i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers.get(i));
                cell.setCellStyle(headerStyle);
            }

            for (int rowIndex = 0; rowIndex < rows.size(); rowIndex++) {
                Row row = sheet.createRow(rowIndex + 1);
                List<String> values = rows.get(rowIndex);
                for (int col = 0; col < values.size(); col++) {
                    row.createCell(col).setCellValue(values.get(col));
                }
            }
            for (int i = 0; i < headers.size(); i++) {
                sheet.autoSizeColumn(i);
            }
            workbook.write(baos);
            return baos.toByteArray();
        } catch (IOException ex) {
            throw new DomainException("REPORT_FAILED", "Unable to create Excel report");
        }
    }

    private byte[] createPdf(List<String> headers, List<List<String>> rows, String title) {
        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            Document document = new Document(PageSize.A4.rotate(), 24, 24, 24, 24);
            PdfWriter.getInstance(document, baos);
            document.open();
            document.add(new Paragraph(title, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14)));
            document.add(new Paragraph("Generated at " + Instant.now()));
            document.add(new Paragraph(" "));

            PdfPTable table = new PdfPTable(headers.size());
            table.setWidthPercentage(100);
            for (String header : headers) {
                PdfPCell cell = new PdfPCell(new Phrase(header));
                cell.setBackgroundColor(new java.awt.Color(234, 243, 238));
                table.addCell(cell);
            }
            for (List<String> row : rows) {
                for (String value : row) {
                    table.addCell(new Phrase(value));
                }
            }
            document.add(table);
            document.close();
            return baos.toByteArray();
        } catch (DocumentException ex) {
            throw new DomainException("REPORT_FAILED", "Unable to create PDF report");
        }
    }

    private Connection open(String url) throws SQLException {
        return DriverManager.getConnection(url, dbUsername, dbPassword);
    }

    private void execute(Connection connection, String sql) throws SQLException {
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.execute();
        }
    }

    private void execute(Connection connection, String sql, List<Long> ids) throws SQLException {
        if (ids.isEmpty()) {
            throw new DomainException("CLEANUP_FAILED", "At least one admin user must exist before cleanup");
        }
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            for (int i = 0; i < ids.size(); i++) {
                ps.setLong(i + 1, ids.get(i));
            }
            ps.executeUpdate();
        }
    }

    private String inClause(List<Long> ids) {
        return String.join(", ", Collections.nCopies(ids.size(), "?"));
    }

    private DbSpec db(String name) {
        return dbSpecs.stream().filter(spec -> spec.name().equals(name)).findFirst()
                .orElseThrow(() -> new DomainException("DB_NOT_FOUND", "Database mapping not found"));
    }

    private String text(Object value) {
        return value == null ? "" : String.valueOf(value);
    }

    private String lowStockLabel(Object availableQty, Object threshold) {
        try {
            int available = Integer.parseInt(text(availableQty));
            int thresholdValue = Integer.parseInt(text(threshold));
            return available <= thresholdValue ? "LOW" : "";
        } catch (NumberFormatException ignored) {
            return "";
        }
    }

    private record DbSpec(String name, String url, List<String> tables) {}

    public record DownloadPayload(String fileName, String contentType, byte[] content) {}

    public record BackupPayload(int version, Instant createdAt, List<DatabaseBackup> databases) {}

    public record DatabaseBackup(String name, List<TableBackup> tables) {}

    public record TableBackup(String table, List<Map<String, Object>> rows) {}
}
