package com.grocery.payment.dto;

import jakarta.validation.constraints.Size;

public record PaymentAccountSettingsRequest(
        @Size(max = 160) String accountHolderName,
        @Size(max = 64) String iban,
        @Size(max = 120) String bankName,
        @Size(max = 120) String paymentReference
) {
}
