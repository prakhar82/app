package com.grocery.identity.dto;

public record AuthResponse(String accessToken, String tokenType, long expiresInSeconds, String role, String email) {
}
