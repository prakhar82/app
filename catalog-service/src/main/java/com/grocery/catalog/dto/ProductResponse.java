package com.grocery.catalog.dto;

import java.math.BigDecimal;

public record ProductResponse(Long id, String name, String sku, String category, String subcategory,
                              BigDecimal price, BigDecimal discountPercent, BigDecimal taxPercent,
                              String unit, String imageUrl, String description) {
}
