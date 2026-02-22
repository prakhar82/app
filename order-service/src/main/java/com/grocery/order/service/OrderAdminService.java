package com.grocery.order.service;

import com.grocery.common.api.DomainException;
import com.grocery.order.client.InventoryClient;
import com.grocery.order.domain.OrderEntity;
import com.grocery.order.dto.AdminSummaryResponse;
import com.grocery.order.repo.OrderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
public class OrderAdminService {
    private static final Set<String> ALLOWED = Set.of(
            "PENDING", "COD_PENDING", "CONFIRMED", "FULFILLING", "SHIPPED", "DELIVERED", "CANCELED", "FAILED", "REJECTED"
    );
    private static final Set<String> ACTIVE = Set.of(
            "PENDING", "COD_PENDING", "CONFIRMED", "FULFILLING", "SHIPPED"
    );

    private final OrderRepository orderRepository;
    private final InventoryClient inventoryClient;

    public OrderAdminService(OrderRepository orderRepository, InventoryClient inventoryClient) {
        this.orderRepository = orderRepository;
        this.inventoryClient = inventoryClient;
    }

    @Transactional(readOnly = true)
    public List<OrderEntity> listActive() {
        return orderRepository.findByStatusInOrderByIdDesc(ACTIVE);
    }

    @Transactional(readOnly = true)
    public AdminSummaryResponse summary() {
        long itemsSold = orderRepository.totalItemsSold();
        var revenue = orderRepository.totalRevenue();
        if (revenue == null) {
            revenue = java.math.BigDecimal.ZERO;
        }
        long inProcess = orderRepository.totalInProcess();
        return new AdminSummaryResponse(itemsSold, revenue, inProcess);
    }

    @Transactional
    public OrderEntity updateStatus(String orderRef, String targetStatusRaw, String comment) {
        String targetStatus = targetStatusRaw.toUpperCase();
        if (!ALLOWED.contains(targetStatus)) {
            throw new DomainException("INVALID_STATUS", "Unsupported status: " + targetStatusRaw);
        }

        OrderEntity order = orderRepository.findByOrderRef(orderRef)
                .orElseThrow(() -> new DomainException("ORDER_NOT_FOUND", "Order not found: " + orderRef));
        String current = order.getStatus().toUpperCase();

        if (!current.equals("DELIVERED") && targetStatus.equals("DELIVERED")) {
            inventoryClient.commit(orderRef);
            order.setRejectionComment(null);
        } else if (!current.equals("CANCELED") && targetStatus.equals("CANCELED")) {
            inventoryClient.release(orderRef);
            order.setRejectionComment(null);
        } else if (targetStatus.equals("REJECTED")) {
            if (comment == null || comment.isBlank()) {
                throw new DomainException("REJECTION_COMMENT_REQUIRED", "Comment is required when rejecting an order");
            }
            inventoryClient.release(orderRef);
            order.setRejectionComment(comment.trim());
        } else {
            order.setRejectionComment(null);
        }

        order.setStatus(targetStatus);
        return orderRepository.save(order);
    }
}
