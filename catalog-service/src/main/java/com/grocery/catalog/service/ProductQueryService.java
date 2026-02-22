package com.grocery.catalog.service;

import com.grocery.catalog.dto.ProductResponse;
import com.grocery.catalog.repo.ProductRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProductQueryService {
    private final ProductRepository productRepository;

    public ProductQueryService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public List<ProductResponse> list(String q) {
        var products = (q == null || q.isBlank()) ? productRepository.findAll() : productRepository.findByNameContainingIgnoreCase(q);
        return products.stream().map(ProductMapper::toResponse).toList();
    }
}
