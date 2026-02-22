package com.grocery.catalog.dto;

import java.util.List;

public record BulkUploadResult(int totalRows, int successRows, int failedRows, List<RowError> errors) {
    public record RowError(int rowNumber, String message) {}
}
