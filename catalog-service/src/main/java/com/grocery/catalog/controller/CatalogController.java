package com.grocery.catalog.controller;

import com.grocery.catalog.dto.BulkUploadResult;
import com.grocery.catalog.dto.ProductResponse;
import com.grocery.catalog.dto.ProductUpdateRequest;
import com.grocery.catalog.service.ExcelUploadService;
import com.grocery.catalog.service.ProductAdminService;
import com.grocery.catalog.service.ProductQueryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import jakarta.validation.Valid;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/catalog")
public class CatalogController {
    private final ProductQueryService productQueryService;
    private final ProductAdminService productAdminService;
    private final ExcelUploadService excelUploadService;

    public CatalogController(ProductQueryService productQueryService,
                             ProductAdminService productAdminService,
                             ExcelUploadService excelUploadService) {
        this.productQueryService = productQueryService;
        this.productAdminService = productAdminService;
        this.excelUploadService = excelUploadService;
    }

    @GetMapping("/products")
    public List<ProductResponse> listProducts(@RequestParam(name = "q", required = false) String q) {
        return productQueryService.list(q);
    }

    @PostMapping(value = "/admin/upload", consumes = "multipart/form-data")
    public ResponseEntity<BulkUploadResult> upload(@RequestPart("file") MultipartFile file) throws IOException {
        return ResponseEntity.ok(excelUploadService.upload(file));
    }

    @GetMapping("/admin/products")
    public List<ProductResponse> adminProducts(@RequestParam(name = "q", required = false) String q) {
        return productAdminService.list(q);
    }

    @PatchMapping("/admin/products/{id}")
    public ProductResponse updateProduct(@PathVariable("id") Long id, @Valid @RequestBody ProductUpdateRequest request) {
        return productAdminService.update(id, request);
    }

    @PostMapping(value = "/admin/products/{id}/image", consumes = "multipart/form-data")
    public ProductResponse uploadProductImage(@PathVariable("id") Long id, @RequestPart("file") MultipartFile file) throws IOException {
        return productAdminService.uploadImage(id, file);
    }
}
