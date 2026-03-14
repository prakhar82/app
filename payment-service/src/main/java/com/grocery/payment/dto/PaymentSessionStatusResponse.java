package com.grocery.payment.dto;

public record PaymentSessionStatusResponse(String providerRef, String status, String paymentStatus, boolean paid) {
}
