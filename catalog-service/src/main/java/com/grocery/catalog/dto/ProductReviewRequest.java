package com.grocery.catalog.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record ProductReviewRequest(
        @NotNull @DecimalMin("0.5") @DecimalMax("5.0") BigDecimal rating,
        @Size(max = 1200) String comment
) {
}
