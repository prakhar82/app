package com.grocery.inventory.dto;

import jakarta.validation.constraints.NotBlank;

public record InventoryAdjustmentRequest(
        @NotBlank String sku,
        int quantityDelta,
        @NotBlank String reason,
        Integer reorderThreshold
) {
}
