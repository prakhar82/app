package com.grocery.catalog.service;

import com.grocery.catalog.domain.Product;
import com.grocery.catalog.dto.ProductResponse;
import com.grocery.catalog.dto.ProductUpdateRequest;
import com.grocery.catalog.repo.ProductRepository;
import com.grocery.common.api.DomainException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;

@Service
public class ProductAdminService {
    private final ProductRepository productRepository;
    private final ImageStorageService imageStorageService;

    public ProductAdminService(ProductRepository productRepository, ImageStorageService imageStorageService) {
        this.productRepository = productRepository;
        this.imageStorageService = imageStorageService;
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> list(String q) {
        var products = (q == null || q.isBlank()) ? productRepository.findAll() : productRepository.findByNameContainingIgnoreCase(q);
        return products.stream().map(ProductMapper::toResponse).toList();
    }

    @Transactional
    public ProductResponse update(Long id, ProductUpdateRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new DomainException("PRODUCT_NOT_FOUND", "Product not found: " + id));

        product.setName(request.name().trim());
        product.setPrice(request.price());
        product.setTaxPercent(request.taxPercent());
        product.setDiscountPercent(request.discountPercent() == null ? BigDecimal.ZERO : request.discountPercent());
        product.setUnit(request.unit().trim());
        product.setDescription(request.description());
        if (request.imageUrl() != null && !request.imageUrl().isBlank()) {
            product.setImageUrl(request.imageUrl().trim());
        }

        return ProductMapper.toResponse(productRepository.save(product));
    }

    @Transactional
    public ProductResponse uploadImage(Long id, MultipartFile file) throws IOException {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new DomainException("PRODUCT_NOT_FOUND", "Product not found: " + id));
        if (file.isEmpty()) {
            throw new DomainException("IMAGE_REQUIRED", "Image file is required");
        }

        String ext = resolveExtension(file.getOriginalFilename(), file.getContentType());
        String imageUrl = imageStorageService.store(product.getSku(), file.getBytes(), ext);
        product.setImageUrl(imageUrl);
        return ProductMapper.toResponse(productRepository.save(product));
    }

    private String resolveExtension(String originalFilename, String contentType) {
        if (originalFilename != null && originalFilename.contains(".")) {
            String ext = originalFilename.substring(originalFilename.lastIndexOf('.') + 1).trim().toLowerCase(Locale.ROOT);
            if (!ext.isBlank()) {
                return ext;
            }
        }
        if (contentType != null && contentType.contains("/")) {
            return contentType.substring(contentType.indexOf('/') + 1).toLowerCase(Locale.ROOT);
        }
        return "png";
    }
}
