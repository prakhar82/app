package com.grocery.identity.dto;

public record MeResponse(
        String email,
        String name,
        String phone,
        String preferredLanguage,
        String accountHolderName,
        String iban,
        String bankName,
        Long defaultAddressId,
        String role,
        String status
) {
}
