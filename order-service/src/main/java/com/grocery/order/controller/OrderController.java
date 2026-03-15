package com.grocery.order.controller;

import com.grocery.order.client.IdentityClient;
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
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/orders")
public class OrderController {
    private final CheckoutService checkoutService;
    private final OrderRepository orderRepository;
    private final OrderAdminService orderAdminService;
    private final IdentityClient identityClient;

    public OrderController(CheckoutService checkoutService,
                           OrderRepository orderRepository,
                           OrderAdminService orderAdminService,
                           IdentityClient identityClient) {
        this.checkoutService = checkoutService;
        this.orderRepository = orderRepository;
        this.orderAdminService = orderAdminService;
        this.identityClient = identityClient;
    }

    @PostMapping("/checkout")
    public CheckoutResponse checkout(@Valid @RequestBody CheckoutRequest request,
                                     @RequestHeader(name = "X-User-Email", required = false) String userEmail) {
        if (userEmail == null || userEmail.isBlank()) {
            throw new DomainException("UNAUTHORIZED", "Missing authenticated user");
        }
        return checkoutService.checkout(request, userEmail);
    }

    @PostMapping("/{orderRef}/confirm-payment")
    public CheckoutResponse confirmPayment(@PathVariable("orderRef") String orderRef,
                                           @RequestParam("providerRef") String providerRef,
                                           @RequestHeader(name = "X-User-Email", required = false) String userEmail) {
        if (userEmail == null || userEmail.isBlank()) {
            throw new DomainException("UNAUTHORIZED", "Missing authenticated user");
        }
        return checkoutService.confirmPayment(orderRef, providerRef, userEmail);
    }

    @PostMapping("/{orderRef}/cancel-payment")
    public CheckoutResponse cancelPayment(@PathVariable("orderRef") String orderRef,
                                          @RequestHeader(name = "X-User-Email", required = false) String userEmail) {
        if (userEmail == null || userEmail.isBlank()) {
            throw new DomainException("UNAUTHORIZED", "Missing authenticated user");
        }
        return checkoutService.cancelPayment(orderRef, userEmail);
    }

    @GetMapping("/me")
    public List<OrderResponse> myOrders(@RequestHeader(name = "X-User-Email", required = false) String userEmail) {
        if (userEmail == null || userEmail.isBlank()) {
            throw new DomainException("UNAUTHORIZED", "Missing authenticated user");
        }
        return orderRepository.findByUserEmailOrderByIdDesc(userEmail).stream()
                .map(order -> toResponseWithPhoneFallback(order, Map.of(userEmail, safePhone(userEmail))))
                .toList();
    }

    @GetMapping("/admin/all")
    public List<OrderResponse> allOrders() {
        var orders = orderRepository.findAll();
        Map<String, String> phonesByEmail = orders.stream()
                .map(order -> order.getUserEmail() == null ? "" : order.getUserEmail().trim().toLowerCase())
                .filter(email -> !email.isBlank())
                .distinct()
                .collect(Collectors.toMap(Function.identity(), this::safePhone));
        return orders.stream()
                .map(order -> toResponseWithPhoneFallback(order, phonesByEmail))
                .toList();
    }

    @GetMapping("/active")
    public List<OrderResponse> listActive() {
        var orders = orderAdminService.listActive();
        Map<String, String> phonesByEmail = orders.stream()
                .map(order -> order.getUserEmail() == null ? "" : order.getUserEmail().trim().toLowerCase())
                .filter(email -> !email.isBlank())
                .distinct()
                .collect(Collectors.toMap(Function.identity(), this::safePhone));
        return orders.stream()
                .map(order -> toResponseWithPhoneFallback(order, phonesByEmail))
                .toList();
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

    private OrderResponse toResponseWithPhoneFallback(com.grocery.order.domain.OrderEntity order, Map<String, String> phonesByEmail) {
        String phone = order.getUserPhone();
        if (phone == null || phone.isBlank()) {
            phone = phonesByEmail.getOrDefault(normalizeEmail(order.getUserEmail()), null);
        }
        return new OrderResponse(
                order.getOrderRef(),
                order.getUserEmail(),
                phone,
                order.getPaymentMethod(),
                order.getStatus(),
                order.getRejectionComment(),
                order.getTotalAmount(),
                order.getCreatedAt(),
                order.getItems().stream()
                        .map(i -> new com.grocery.order.dto.OrderItemResponse(i.getSku(), i.getItemName(), i.getQuantity(), i.getUnitPrice()))
                        .toList()
        );
    }

    private String safePhone(String email) {
        try {
            return identityClient.getProfile(email).phone();
        } catch (Exception ignored) {
            return null;
        }
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }
}
