package com.grocery.payment.dto;

public record PaymentIntentResponse(String orderRef, String status, String providerRef) {}
