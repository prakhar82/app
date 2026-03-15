package com.grocery.catalog.service;

import com.grocery.catalog.dto.ProductResponse;
import com.grocery.catalog.repo.ProductRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class ProductQueryService {
    private final ProductRepository productRepository;
    private final ProductReviewService productReviewService;

    public ProductQueryService(ProductRepository productRepository, ProductReviewService productReviewService) {
        this.productRepository = productRepository;
        this.productReviewService = productReviewService;
    }

    public List<ProductResponse> list(String q) {
        var products = (q == null || q.isBlank()) ? productRepository.findAll() : productRepository.findByNameContainingIgnoreCase(q);
        Map<Long, ProductReviewService.ProductReviewSummary> summaries =
                productReviewService.summarize(products.stream().map(p -> p.getId()).toList());
        return products.stream().map(product -> {
            ProductReviewService.ProductReviewSummary summary = summaries.get(product.getId());
            return ProductMapper.toResponse(
                    product,
                    summary == null ? null : summary.averageRating(),
                    summary == null ? 0 : summary.reviewCount()
            );
        }).toList();
    }
}
