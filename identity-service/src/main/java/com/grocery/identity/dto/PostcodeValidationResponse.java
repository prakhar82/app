package com.grocery.identity.dto;

public record PostcodeValidationResponse(
        boolean allowed,
        String city,
        String reason,
        String normalizedPostcode
) {
}
