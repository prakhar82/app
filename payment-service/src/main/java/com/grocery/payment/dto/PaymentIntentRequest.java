package com.grocery.payment.dto;

import java.math.BigDecimal;

public record PaymentIntentRequest(String orderRef, BigDecimal amount, String method) {}
