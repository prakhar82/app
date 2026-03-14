package com.grocery.identity.dto;

public record AdminUpdateUserRequest(
        String name,
        String phone,
        String password,
        String role,
        String status
) {
}
