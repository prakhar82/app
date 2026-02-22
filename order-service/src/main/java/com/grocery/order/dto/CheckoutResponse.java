package com.grocery.order.dto;

public record CheckoutResponse(String orderRef, String status, String paymentStatus) {
}
