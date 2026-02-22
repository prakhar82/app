package com.grocery.identity.dto;

import jakarta.validation.constraints.Size;

public record UpdateMeRequest(
        @Size(max = 120) String name,
        @Size(max = 40) String phone,
        @Size(max = 10) String preferredLanguage,
        Long defaultAddressId
) {
}
