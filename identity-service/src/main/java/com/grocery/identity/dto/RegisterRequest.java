package com.grocery.identity.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @Email @NotBlank String email,
        String name,
        String phone,
        @Size(min = 6, max = 128) String password
) {
}
