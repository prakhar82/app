package com.grocery.order.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record OrderResponse(
        String orderRef,
        String userEmail,
        String paymentMethod,
        String status,
        String rejectionComment,
        BigDecimal totalAmount,
        Instant createdAt,
        List<OrderItemResponse> items
) {
}
