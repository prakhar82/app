package com.grocery.catalog.service;

import com.grocery.catalog.domain.Product;
import com.grocery.catalog.domain.ProductReview;
import com.grocery.catalog.dto.ProductReviewRequest;
import com.grocery.catalog.dto.ProductReviewResponse;
import com.grocery.catalog.repo.ProductRepository;
import com.grocery.catalog.repo.ProductReviewRepository;
import com.grocery.common.api.DomainException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ProductReviewService {
    private final ProductRepository productRepository;
    private final ProductReviewRepository productReviewRepository;

    public ProductReviewService(ProductRepository productRepository, ProductReviewRepository productReviewRepository) {
        this.productRepository = productRepository;
        this.productReviewRepository = productReviewRepository;
    }

    @Transactional(readOnly = true)
    public List<ProductReviewResponse> listForProduct(Long productId) {
        ensureProduct(productId);
        return productReviewRepository.findByProductIdOrderByUpdatedAtDesc(productId).stream()
                .map(ProductMapper::toReviewResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public Optional<ProductReviewResponse> findOwnReview(Long productId, String userEmail) {
        ensureProduct(productId);
        return productReviewRepository.findByProductIdAndUserEmailIgnoreCase(productId, userEmail)
                .map(ProductMapper::toReviewResponse);
    }

    @Transactional
    public ProductReviewResponse upsert(Long productId, String userEmail, ProductReviewRequest request) {
        Product product = ensureProduct(productId);
        BigDecimal rating = validateRating(request.rating());
        ProductReview review = productReviewRepository.findByProductIdAndUserEmailIgnoreCase(productId, userEmail)
                .orElseGet(ProductReview::new);
        review.setProduct(product);
        review.setUserEmail(userEmail.trim().toLowerCase(Locale.ROOT));
        review.setUserDisplayName(displayNameFromEmail(userEmail));
        review.setRating(rating);
        review.setComment(normalizeComment(request.comment()));
        return ProductMapper.toReviewResponse(productReviewRepository.save(review));
    }

    @Transactional(readOnly = true)
    public Map<Long, ProductReviewSummary> summarize(List<Long> productIds) {
        if (productIds.isEmpty()) {
            return Map.of();
        }
        return productReviewRepository.summarizeByProductIds(productIds).stream()
                .collect(Collectors.toMap(
                        ProductReviewRepository.ProductReviewSummaryView::getProductId,
                        row -> new ProductReviewSummary(
                                row.getAverageRating() == null ? BigDecimal.ZERO : row.getAverageRating().setScale(1, RoundingMode.HALF_UP),
                                row.getReviewCount())
                ));
    }

    private Product ensureProduct(Long productId) {
        return productRepository.findById(productId)
                .orElseThrow(() -> new DomainException("PRODUCT_NOT_FOUND", "Product not found: " + productId));
    }

    private BigDecimal validateRating(BigDecimal rating) {
        if (rating == null) {
            throw new DomainException("REVIEW_RATING_REQUIRED", "Rating is required");
        }
        BigDecimal normalized = rating.setScale(1, RoundingMode.HALF_UP);
        if (normalized.compareTo(new BigDecimal("0.5")) < 0 || normalized.compareTo(new BigDecimal("5.0")) > 0) {
            throw new DomainException("REVIEW_RATING_INVALID", "Rating must be between 0.5 and 5.0");
        }
        if (normalized.remainder(BigDecimal.valueOf(0.5)).compareTo(BigDecimal.ZERO) != 0) {
            throw new DomainException("REVIEW_RATING_INVALID", "Rating must use half-star steps");
        }
        return normalized;
    }

    private String normalizeComment(String comment) {
        if (comment == null) {
            return null;
        }
        String trimmed = comment.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String displayNameFromEmail(String email) {
        String local = email == null ? "" : email.trim();
        int at = local.indexOf('@');
        if (at > 0) {
            local = local.substring(0, at);
        }
        String[] parts = local.split("[._\\-]+");
        String display = java.util.Arrays.stream(parts)
                .filter(part -> !part.isBlank())
                .map(part -> Character.toUpperCase(part.charAt(0)) + part.substring(1).toLowerCase(Locale.ROOT))
                .collect(Collectors.joining(" "));
        return display.isBlank() ? "Verified User" : display;
    }

    public record ProductReviewSummary(BigDecimal averageRating, long reviewCount) {}
}
