package com.grocery.order.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;

public record CheckoutRequest(
        @NotBlank String paymentMethod,
        @Valid @NotNull List<Item> items,
        @NotBlank String addressMode,
        Long addressId,
        Boolean saveAddress,
        @Valid AddressInput newAddress
) {
    public record Item(@NotBlank String sku, @NotBlank String name, @Min(1) int qty, @NotNull BigDecimal unitPrice) {}

    public record AddressInput(
            String label,
            @NotBlank String line1,
            String line2,
            @NotBlank String city,
            @NotBlank String postcode,
            @NotBlank String country
    ) {}
}
