package com.grocery.catalog.repo;

import com.grocery.catalog.domain.ProductReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ProductReviewRepository extends JpaRepository<ProductReview, Long> {
    List<ProductReview> findByProductIdOrderByUpdatedAtDesc(Long productId);
    Optional<ProductReview> findByProductIdAndUserEmailIgnoreCase(Long productId, String userEmail);

    @Query("""
            select r.product.id as productId,
                   coalesce(avg(r.rating), 0) as averageRating,
                   count(r.id) as reviewCount
            from ProductReview r
            where r.product.id in :productIds
            group by r.product.id
            """)
    List<ProductReviewSummaryView> summarizeByProductIds(Collection<Long> productIds);

    interface ProductReviewSummaryView {
        Long getProductId();
        BigDecimal getAverageRating();
        long getReviewCount();
    }
}
