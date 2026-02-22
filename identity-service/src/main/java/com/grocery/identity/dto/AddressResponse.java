package com.grocery.identity.dto;

import com.grocery.identity.domain.UserAddress;

public record AddressResponse(
        Long id,
        String label,
        String line1,
        String line2,
        String city,
        String postcode,
        String country,
        boolean isDefault
) {
    public static AddressResponse from(UserAddress address) {
        return new AddressResponse(
                address.getId(),
                address.getLabel(),
                address.getLine1(),
                address.getLine2(),
                address.getCity(),
                address.getPostcode(),
                address.getCountry(),
                address.isDefault()
        );
    }
}
