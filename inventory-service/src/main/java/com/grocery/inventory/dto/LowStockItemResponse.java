package com.grocery.inventory.dto;

public record LowStockItemResponse(String sku, String productName, int availableQty, int thresholdQty) {
}
