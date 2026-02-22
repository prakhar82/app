package com.grocery.identity.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record AddressUpsertRequest(
        @Size(max = 40) String label,
        @NotBlank @Size(max = 200) String line1,
        @Size(max = 200) String line2,
        @NotBlank @Size(max = 80) String city,
        @NotBlank @Pattern(regexp = "^[0-9]{4}\\s?[A-Za-z]{2}$", message = "Postcode must be in format 1234AB") String postcode,
        @NotBlank @Pattern(regexp = "^[A-Za-z]{2}$") String country,
        boolean isDefault
) {
}
