package com.grocery.catalog.service;

public interface ImageStorageService {
    String store(String sku, byte[] content, String extension);
}
