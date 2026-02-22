package com.grocery.catalog.config;

import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.FileOutputStream;
import java.nio.file.Files;
import java.nio.file.Path;

@Configuration
public class SampleExcelConfig {

    @Bean
    CommandLineRunner sampleExcelGenerator(@Value("${app.sample-excel-path:../samples/catalog-upload.xlsx}") String excelPath) {
        return args -> {
            Path path = Path.of(excelPath).normalize();
            if (Files.exists(path)) {
                return;
            }
            Files.createDirectories(path.getParent());
            try (var wb = new XSSFWorkbook()) {
                var sheet = wb.createSheet("catalog");
                var header = sheet.createRow(0);
                String[] cols = {"total_qty", "category", "subcategory", "item_name", "sku", "price", "discount", "tax", "unit", "description", "image_url"};
                for (int i = 0; i < cols.length; i++) {
                    header.createCell(i).setCellValue(cols[i]);
                }
                Object[][] rows = {
                        {120, "Fruits", "Citrus", "Orange", "SKU-ORANGE", 60, 5, 5, "kg", "Fresh oranges", "https://placehold.co/200x200"},
                        {80, "Vegetables", "Leafy", "Spinach", "SKU-SPINACH", 40, 0, 2, "kg", "Organic spinach", "https://placehold.co/200x200"},
                        {200, "Dairy", "Milk", "Milk 1L", "SKU-MILK1L", 55, 0, 5, "l", "Cow milk", "https://placehold.co/200x200"}
                };
                for (int r = 0; r < rows.length; r++) {
                    var row = sheet.createRow(r + 1);
                    for (int c = 0; c < rows[r].length; c++) {
                        row.createCell(c).setCellValue(String.valueOf(rows[r][c]));
                    }
                }
                try (var fos = new FileOutputStream(path.toFile())) {
                    wb.write(fos);
                }
            }
        };
    }
}
