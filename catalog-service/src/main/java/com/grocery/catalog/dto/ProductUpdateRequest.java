package com.grocery.catalog.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record ProductUpdateRequest(
        @NotBlank String name,
        @NotNull @DecimalMin("0.0") BigDecimal price,
        @NotNull @DecimalMin("0.0") BigDecimal taxPercent,
        @DecimalMin("0.0") BigDecimal discountPercent,
        @NotBlank String unit,
        String description,
        String imageUrl
) {
}
