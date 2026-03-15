package com.grocery.catalog.service;

import com.grocery.catalog.domain.Product;
import com.grocery.catalog.domain.ProductReview;
import com.grocery.catalog.dto.ProductResponse;
import com.grocery.catalog.dto.ProductReviewResponse;

import java.math.BigDecimal;

public final class ProductMapper {
    private ProductMapper() {}

    public static ProductResponse toResponse(Product p) {
        return new ProductResponse(p.getId(), p.getName(), p.getSku(), p.getCategory().getName(), p.getSubcategory().getName(),
                p.getPrice(), p.getDiscountPercent(), p.getTaxPercent(), p.getUnit(), p.getImageUrl(), p.getDescription(),
                BigDecimal.ZERO.setScale(1), 0);
    }

    public static ProductResponse toResponse(Product p, BigDecimal averageRating, long reviewCount) {
        return new ProductResponse(p.getId(), p.getName(), p.getSku(), p.getCategory().getName(), p.getSubcategory().getName(),
                p.getPrice(), p.getDiscountPercent(), p.getTaxPercent(), p.getUnit(), p.getImageUrl(), p.getDescription(),
                averageRating == null ? BigDecimal.ZERO.setScale(1) : averageRating, reviewCount);
    }

    public static ProductReviewResponse toReviewResponse(ProductReview review) {
        return new ProductReviewResponse(
                review.getId(),
                review.getUserDisplayName(),
                review.getRating(),
                review.getComment(),
                review.getCreatedAt(),
                review.getUpdatedAt()
        );
    }
}
