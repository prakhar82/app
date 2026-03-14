package com.grocery.payment.dto;

public record PaymentAccountSettingsResponse(
        String accountHolderName,
        String iban,
        String bankName,
        String paymentReference
) {
}
