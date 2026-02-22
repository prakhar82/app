package com.grocery.inventory.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record CartReservationRequest(
        @NotBlank String userEmail,
        @NotBlank String sku,
        @Min(1) int quantity
) {
}
