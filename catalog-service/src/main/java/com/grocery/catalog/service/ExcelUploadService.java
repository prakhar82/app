package com.grocery.catalog.service;

import com.grocery.catalog.domain.Category;
import com.grocery.catalog.domain.Product;
import com.grocery.catalog.domain.Subcategory;
import com.grocery.catalog.dto.BulkUploadResult;
import com.grocery.catalog.repo.CategoryRepository;
import com.grocery.catalog.repo.ProductRepository;
import com.grocery.catalog.repo.SubcategoryRepository;
import org.apache.poi.ss.usermodel.ClientAnchor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFPicture;
import org.apache.poi.xssf.usermodel.XSSFSheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ExcelUploadService {
    private final CategoryRepository categoryRepository;
    private final SubcategoryRepository subcategoryRepository;
    private final ProductRepository productRepository;
    private final ImageStorageService imageStorageService;
    private final RestTemplate restTemplate = new RestTemplate();
    private final String inventoryBaseUrl;

    public ExcelUploadService(CategoryRepository categoryRepository,
                              SubcategoryRepository subcategoryRepository,
                              ProductRepository productRepository,
                              ImageStorageService imageStorageService,
                              @Value("${app.inventory-base-url:http://inventory-service:8083}") String inventoryBaseUrl) {
        this.categoryRepository = categoryRepository;
        this.subcategoryRepository = subcategoryRepository;
        this.productRepository = productRepository;
        this.imageStorageService = imageStorageService;
        this.inventoryBaseUrl = inventoryBaseUrl;
    }

    @Transactional
    public BulkUploadResult upload(MultipartFile file) throws IOException {
        List<BulkUploadResult.RowError> errors = new ArrayList<>();
        int success = 0;
        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            Map<Integer, XSSFPicture> imagesByRow = extractImagesByRow(workbook, sheet);
            int totalRows = sheet.getPhysicalNumberOfRows() - 1;
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;
                try {
                    String categoryName = str(row, 1);
                    String subcategoryName = str(row, 2);
                    String itemName = str(row, 3);
                    String sku = str(row, 4);
                    int quantityToAdd = intCell(row, 0);
                    BigDecimal price = dec(row, 5);
                    BigDecimal discount = nullableDec(row, 6);
                    BigDecimal tax = dec(row, 7);
                    String unit = str(row, 8);
                    String description = str(row, 9);
                    String image = optStr(row, 10);

                    Category category = getOrCreateCategory(categoryName);
                    Subcategory subcategory = getOrCreateSubcategory(subcategoryName, category);

                    Product product = productRepository.findBySku(sku).orElseGet(Product::new);
                    product.setCategory(category);
                    product.setSubcategory(subcategory);
                    product.setName(itemName);
                    product.setSku(sku);
                    product.setPrice(price);
                    product.setDiscountPercent(discount);
                    product.setTaxPercent(tax);
                    product.setUnit(unit);
                    product.setDescription(description);
                    if (image != null && !image.isBlank()) {
                        product.setImageUrl(image);
                    } else if (imagesByRow.containsKey(i)) {
                        XSSFPicture picture = imagesByRow.get(i);
                        String ext = picture.getPictureData().suggestFileExtension();
                        product.setImageUrl(imageStorageService.store(sku, picture.getPictureData().getData(), ext));
                    }
                    productRepository.save(product);
                    upsertInventoryQuantity(product.getSku(), product.getName(), quantityToAdd);
                    success++;
                } catch (Exception ex) {
                    errors.add(new BulkUploadResult.RowError(i + 1, ex.getMessage()));
                }
            }
            return new BulkUploadResult(totalRows, success, errors.size(), errors);
        }
    }

    private static String str(Row row, int index) {
        Cell c = row.getCell(index);
        if (c == null) throw new IllegalArgumentException("Missing column " + index);
        String value = c.toString().trim();
        if (value.isBlank()) throw new IllegalArgumentException("Blank value at column " + index);
        return value;
    }

    private static BigDecimal dec(Row row, int index) {
        return new BigDecimal(str(row, index));
    }

    private static int intCell(Row row, int index) {
        String raw = str(row, index);
        int value;
        try {
            value = new BigDecimal(raw).intValueExact();
        } catch (ArithmeticException | NumberFormatException ex) {
            throw new IllegalArgumentException("Invalid integer at column " + index + ": " + raw);
        }
        if (value < 0) {
            throw new IllegalArgumentException("Quantity cannot be negative at column " + index);
        }
        return value;
    }

    private static BigDecimal nullableDec(Row row, int index) {
        Cell c = row.getCell(index);
        if (c == null || c.toString().isBlank()) return BigDecimal.ZERO;
        return new BigDecimal(c.toString().trim());
    }

    private static String optStr(Row row, int index) {
        Cell c = row.getCell(index);
        return c == null ? null : c.toString().trim();
    }

    private void upsertInventoryQuantity(String sku, String productName, int quantityToAdd) {
        if (quantityToAdd == 0) {
            return;
        }
        String url = inventoryBaseUrl + "/inventory/admin/upsert";
        Map<String, Object> payload = new HashMap<>();
        payload.put("sku", sku);
        payload.put("productName", productName);
        payload.put("quantityDelta", quantityToAdd);
        restTemplate.postForEntity(url, payload, Object.class);
    }

    private Category getOrCreateCategory(String categoryName) {
        String normalized = normalizeRequired(categoryName, "category");
        return categoryRepository.findByNameIgnoreCase(normalized).orElseGet(() -> {
            Category category = new Category();
            category.setName(normalized);
            return categoryRepository.save(category);
        });
    }

    private Subcategory getOrCreateSubcategory(String subcategoryName, Category category) {
        String normalized = normalizeRequired(subcategoryName, "subcategory");
        return subcategoryRepository.findByNameIgnoreCaseAndCategory(normalized, category).orElseGet(() -> {
            Subcategory subcategory = new Subcategory();
            subcategory.setName(normalized);
            subcategory.setCategory(category);
            return subcategoryRepository.save(subcategory);
        });
    }

    private static String normalizeRequired(String value, String fieldName) {
        if (value == null) {
            throw new IllegalArgumentException("Missing " + fieldName);
        }
        String normalized = value.trim();
        if (normalized.isBlank()) {
            throw new IllegalArgumentException("Blank " + fieldName);
        }
        return normalized;
    }

    private static Map<Integer, XSSFPicture> extractImagesByRow(Workbook workbook, Sheet sheet) {
        Map<Integer, XSSFPicture> imagesByRow = new HashMap<>();
        if (!(workbook instanceof XSSFWorkbook xssfWorkbook) || !(sheet instanceof XSSFSheet xssfSheet)) {
            return imagesByRow;
        }
        var drawing = xssfSheet.getDrawingPatriarch();
        if (drawing == null) {
            return imagesByRow;
        }
        drawing.getShapes().forEach(shape -> {
            if (shape instanceof XSSFPicture pic) {
                ClientAnchor anchor = pic.getPreferredSize();
                imagesByRow.put(anchor.getRow1(), pic);
            }
        });
        return imagesByRow;
    }
}
