package com.grocery.order.dto;

public record PaymentStatusResponse(String providerRef, String status, String paymentStatus, boolean paid) {
}
