package com.grocery.order.controller;

import com.grocery.order.dto.CheckoutRequest;
import com.grocery.order.dto.CheckoutResponse;
import com.grocery.order.dto.OrderResponse;
import com.grocery.order.dto.UpdateOrderStatusRequest;
import com.grocery.order.repo.OrderRepository;
import com.grocery.order.service.OrderAdminService;
import com.grocery.order.service.CheckoutService;
import com.grocery.order.service.OrderMapper;
import com.grocery.common.api.DomainException;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/orders")
public class OrderController {
    private final CheckoutService checkoutService;
    private final OrderRepository orderRepository;
    private final OrderAdminService orderAdminService;

    public OrderController(CheckoutService checkoutService, OrderRepository orderRepository, OrderAdminService orderAdminService) {
        this.checkoutService = checkoutService;
        this.orderRepository = orderRepository;
        this.orderAdminService = orderAdminService;
    }

    @PostMapping("/checkout")
    public CheckoutResponse checkout(@Valid @RequestBody CheckoutRequest request,
                                     @RequestHeader(name = "X-User-Email", required = false) String userEmail) {
        if (userEmail == null || userEmail.isBlank()) {
            throw new DomainException("UNAUTHORIZED", "Missing authenticated user");
        }
        return checkoutService.checkout(request, userEmail);
    }

    @GetMapping("/me")
    public List<OrderResponse> myOrders(@RequestHeader(name = "X-User-Email", required = false) String userEmail) {
        if (userEmail == null || userEmail.isBlank()) {
            throw new DomainException("UNAUTHORIZED", "Missing authenticated user");
        }
        return orderRepository.findByUserEmailOrderByIdDesc(userEmail).stream().map(OrderMapper::toResponse).toList();
    }

    @GetMapping("/admin/all")
    public List<OrderResponse> allOrders() {
        return orderRepository.findAll().stream().map(OrderMapper::toResponse).toList();
    }

    @GetMapping("/active")
    public List<OrderResponse> listActive() {
        return orderAdminService.listActive().stream().map(OrderMapper::toResponse).toList();
    }

    @PatchMapping("/{orderRef}/status")
    public OrderResponse updateStatus(@PathVariable("orderRef") String orderRef,
                                      @Valid @RequestBody UpdateOrderStatusRequest request) {
        return OrderMapper.toResponse(orderAdminService.updateStatus(orderRef, request.status(), request.comment()));
    }

    @GetMapping("/admin/summary")
    public Object summary() {
        return orderAdminService.summary();
    }
}
