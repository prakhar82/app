package com.grocery.catalog.service;

import com.grocery.catalog.domain.Product;
import com.grocery.catalog.dto.ProductResponse;

public final class ProductMapper {
    private ProductMapper() {}

    public static ProductResponse toResponse(Product p) {
        return new ProductResponse(p.getId(), p.getName(), p.getSku(), p.getCategory().getName(), p.getSubcategory().getName(),
                p.getPrice(), p.getDiscountPercent(), p.getTaxPercent(), p.getUnit(), p.getImageUrl(), p.getDescription());
    }
}
