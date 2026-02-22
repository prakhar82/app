package com.grocery.inventory.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record InventoryUpsertRequest(
        @NotBlank String sku,
        @NotBlank String productName,
        @NotNull Integer quantityDelta,
        Integer reorderThreshold
) {
}
