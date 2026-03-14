package com.grocery.identity.dto;

import java.time.Instant;

public record AdminUserResponse(
        Long id,
        String email,
        String name,
        String phone,
        String role,
        String status,
        boolean googleVerified,
        Instant createdAt
) {
}
