package com.grocery.identity.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record AdminCreateUserRequest(
        @Email @NotBlank String email,
        String name,
        String phone,
        @NotBlank @Size(min = 6, max = 128) String password,
        @Pattern(regexp = "ADMIN|USER") String role
) {
}
