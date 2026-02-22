package com.grocery.cart.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record UpsertCartItemRequest(
        @NotBlank String userEmail,
        @NotBlank String sku,
        @NotBlank String itemName,
        @Min(0) int quantity
) {
}
