package com.grocery.identity.dto;

public record MeResponse(
        String email,
        String name,
        String phone,
        String preferredLanguage,
        Long defaultAddressId,
        String role,
        String status
) {
}
