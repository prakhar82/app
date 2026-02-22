package com.grocery.order.service;

import com.grocery.order.domain.OrderEntity;
import com.grocery.order.dto.OrderItemResponse;
import com.grocery.order.dto.OrderResponse;

public final class OrderMapper {
    private OrderMapper() {
    }

    public static OrderResponse toResponse(OrderEntity order) {
        return new OrderResponse(
                order.getOrderRef(),
                order.getUserEmail(),
                order.getPaymentMethod(),
                order.getStatus(),
                order.getRejectionComment(),
                order.getTotalAmount(),
                order.getCreatedAt(),
                order.getItems().stream()
                        .map(i -> new OrderItemResponse(i.getSku(), i.getItemName(), i.getQuantity(), i.getUnitPrice()))
                        .toList()
        );
    }
}
