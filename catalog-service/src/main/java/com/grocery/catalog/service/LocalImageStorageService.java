package com.grocery.catalog.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

@Service
public class LocalImageStorageService implements ImageStorageService {

    private final Path basePath;

    public LocalImageStorageService(@Value("${app.image-local-path:./data/images}") String basePath) {
        this.basePath = Path.of(basePath);
    }

    @Override
    public String store(String sku, byte[] content, String extension) {
        try {
            Files.createDirectories(basePath);
            String filename = sku + "-" + System.currentTimeMillis() + "." + extension;
            Path file = basePath.resolve(filename);
            Files.write(file, content);
            return "/api/catalog/images/" + filename;
        } catch (IOException e) {
            throw new IllegalStateException("Failed to store image", e);
        }
    }
}
