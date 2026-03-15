package com.grocery.catalog.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record ProductReviewResponse(
        Long id,
        String userDisplayName,
        BigDecimal rating,
        String comment,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
}
