package com.grocery.identity.dto;

import jakarta.validation.constraints.Size;

public record UpdateMeRequest(
        @Size(max = 120) String name,
        @Size(max = 40) String phone,
        @Size(max = 10) String preferredLanguage,
        @Size(max = 160) String accountHolderName,
        @Size(max = 64) String iban,
        @Size(max = 120) String bankName,
        Long defaultAddressId
) {
}
