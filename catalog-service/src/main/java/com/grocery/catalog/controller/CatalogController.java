package com.grocery.catalog.controller;

import com.grocery.catalog.dto.BulkUploadResult;
import com.grocery.catalog.dto.ProductCreateRequest;
import com.grocery.catalog.dto.ProductReviewRequest;
import com.grocery.catalog.dto.ProductReviewResponse;
import com.grocery.catalog.dto.ProductResponse;
import com.grocery.catalog.dto.ProductUpdateRequest;
import com.grocery.catalog.service.ExcelUploadService;
import com.grocery.catalog.service.ProductAdminService;
import com.grocery.catalog.service.ProductQueryService;
import com.grocery.catalog.service.ProductReviewService;
import com.grocery.common.api.DomainException;
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
    private final ProductReviewService productReviewService;
    private final ExcelUploadService excelUploadService;

    public CatalogController(ProductQueryService productQueryService,
                             ProductAdminService productAdminService,
                             ProductReviewService productReviewService,
                             ExcelUploadService excelUploadService) {
        this.productQueryService = productQueryService;
        this.productAdminService = productAdminService;
        this.productReviewService = productReviewService;
        this.excelUploadService = excelUploadService;
    }

    @GetMapping("/products")
    public List<ProductResponse> listProducts(@RequestParam(name = "q", required = false) String q) {
        return productQueryService.list(q);
    }

    @GetMapping("/products/{id}/reviews")
    public List<ProductReviewResponse> listReviews(@PathVariable("id") Long id) {
        return productReviewService.listForProduct(id);
    }

    @GetMapping("/me/reviews/{productId}")
    public ResponseEntity<ProductReviewResponse> myReview(@PathVariable("productId") Long productId,
                                                          @RequestHeader(name = "X-User-Email", required = false) String userEmail) {
        return ResponseEntity.of(productReviewService.findOwnReview(productId, requireUser(userEmail)));
    }

    @PostMapping("/me/reviews/{productId}")
    public ProductReviewResponse upsertReview(@PathVariable("productId") Long productId,
                                              @Valid @RequestBody ProductReviewRequest request,
                                              @RequestHeader(name = "X-User-Email", required = false) String userEmail) {
        return productReviewService.upsert(productId, requireUser(userEmail), request);
    }

    @PostMapping(value = "/admin/upload", consumes = "multipart/form-data")
    public ResponseEntity<BulkUploadResult> upload(@RequestPart("file") MultipartFile file) throws IOException {
        return ResponseEntity.ok(excelUploadService.upload(file));
    }

    @GetMapping("/admin/products")
    public List<ProductResponse> adminProducts(@RequestParam(name = "q", required = false) String q) {
        return productAdminService.list(q);
    }

    @PostMapping("/admin/products")
    public ProductResponse createProduct(@Valid @RequestBody ProductCreateRequest request) {
        return productAdminService.create(request);
    }

    @PatchMapping("/admin/products/{id}")
    public ProductResponse updateProduct(@PathVariable("id") Long id, @Valid @RequestBody ProductUpdateRequest request) {
        return productAdminService.update(id, request);
    }

    @DeleteMapping("/admin/products/{id}")
    public void deleteProduct(@PathVariable("id") Long id) {
        productAdminService.delete(id);
    }

    @PostMapping(value = "/admin/products/{id}/image", consumes = "multipart/form-data")
    public ProductResponse uploadProductImage(@PathVariable("id") Long id, @RequestPart("file") MultipartFile file) throws IOException {
        return productAdminService.uploadImage(id, file);
    }

    private String requireUser(String userEmail) {
        if (userEmail == null || userEmail.isBlank()) {
            throw new DomainException("UNAUTHORIZED", "Login required");
        }
        return userEmail;
    }
}
