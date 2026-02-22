package com.grocery.order.service;

import com.grocery.order.client.InventoryClient;
import com.grocery.order.client.IdentityClient;
import com.grocery.order.client.PaymentClient;
import com.grocery.order.domain.OrderDeliveryAddressEntity;
import com.grocery.order.domain.OrderEntity;
import com.grocery.order.domain.OrderItemEntity;
import com.grocery.order.dto.CheckoutRequest;
import com.grocery.order.dto.CheckoutResponse;
import com.grocery.order.repo.OrderDeliveryAddressRepository;
import com.grocery.order.repo.OrderRepository;
import com.grocery.common.api.DomainException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Service
public class CheckoutService {
    private final OrderRepository orderRepository;
    private final OrderDeliveryAddressRepository orderDeliveryAddressRepository;
    private final InventoryClient inventoryClient;
    private final PaymentClient paymentClient;
    private final IdentityClient identityClient;

    public CheckoutService(OrderRepository orderRepository,
                           OrderDeliveryAddressRepository orderDeliveryAddressRepository,
                           InventoryClient inventoryClient,
                           PaymentClient paymentClient,
                           IdentityClient identityClient) {
        this.orderRepository = orderRepository;
        this.orderDeliveryAddressRepository = orderDeliveryAddressRepository;
        this.inventoryClient = inventoryClient;
        this.paymentClient = paymentClient;
        this.identityClient = identityClient;
    }

    @Transactional
    public CheckoutResponse checkout(CheckoutRequest request, String authenticatedEmail) {
        DeliveryAddressSnapshot deliveryAddress = resolveAddress(authenticatedEmail, request);
        String orderRef = "ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        OrderEntity order = new OrderEntity();
        order.setOrderRef(orderRef);
        order.setUserEmail(authenticatedEmail);
        order.setPaymentMethod(request.paymentMethod());
        order.setStatus("PENDING");

        BigDecimal total = BigDecimal.ZERO;
        for (CheckoutRequest.Item item : request.items()) {
            OrderItemEntity e = new OrderItemEntity();
            e.setOrder(order);
            e.setSku(item.sku());
            e.setItemName(item.name());
            e.setQuantity(item.qty());
            e.setUnitPrice(item.unitPrice());
            order.getItems().add(e);
            total = total.add(item.unitPrice().multiply(BigDecimal.valueOf(item.qty())));
        }
        order.setTotalAmount(total);
        orderRepository.save(order);
        saveDeliveryAddress(order, deliveryAddress);

        inventoryClient.reserve(orderRef, request.items());

        if ("COD".equalsIgnoreCase(request.paymentMethod())) {
            order.setStatus("COD_PENDING");
            return new CheckoutResponse(orderRef, order.getStatus(), "NOT_REQUIRED");
        }

        String paymentStatus = paymentClient.pay(orderRef, total, request.paymentMethod());
        if ("SUCCESS".equalsIgnoreCase(paymentStatus)) {
            inventoryClient.commit(orderRef);
            order.setStatus("CONFIRMED");
            return new CheckoutResponse(orderRef, order.getStatus(), "SUCCESS");
        }

        inventoryClient.release(orderRef);
        order.setStatus("PAYMENT_FAILED");
        return new CheckoutResponse(orderRef, order.getStatus(), paymentStatus);
    }

    private DeliveryAddressSnapshot resolveAddress(String authenticatedEmail, CheckoutRequest request) {
        if ("SAVED".equalsIgnoreCase(request.addressMode())) {
            if (request.addressId() == null) {
                throw new DomainException("ADDRESS_REQUIRED", "Address selection is required");
            }
            IdentityClient.AddressResponse address = identityClient.getAddress(authenticatedEmail, request.addressId());
            validatePostcode(address.postcode(), address.country());
            return new DeliveryAddressSnapshot(address.label(), address.line1(), address.line2(), address.city(), address.postcode(), address.country());
        }
        if (!"NEW".equalsIgnoreCase(request.addressMode())) {
            throw new DomainException("INVALID_ADDRESS_MODE", "addressMode must be SAVED or NEW");
        }
        if (request.newAddress() == null) {
            throw new DomainException("ADDRESS_REQUIRED", "New address is required");
        }
        validatePostcode(request.newAddress().postcode(), request.newAddress().country());
        if (Boolean.TRUE.equals(request.saveAddress())) {
            identityClient.createAddress(authenticatedEmail, request.newAddress());
        }
        return new DeliveryAddressSnapshot(
                request.newAddress().label(),
                request.newAddress().line1(),
                request.newAddress().line2(),
                request.newAddress().city(),
                request.newAddress().postcode(),
                request.newAddress().country());
    }

    private void validatePostcode(String postcode, String country) {
        IdentityClient.PostcodeValidationResponse validation = identityClient.validatePostcode(postcode, country);
        if (!validation.allowed()) {
            throw new DomainException("POSTCODE_NOT_ALLOWED", validation.reason());
        }
    }

    private void saveDeliveryAddress(OrderEntity order, DeliveryAddressSnapshot snapshot) {
        OrderDeliveryAddressEntity entity = new OrderDeliveryAddressEntity();
        entity.setOrderId(order.getId());
        entity.setRecipientName(snapshot.label());
        entity.setLine1(snapshot.line1());
        entity.setLine2(snapshot.line2());
        entity.setCity(snapshot.city());
        entity.setPostcode(snapshot.postcode());
        entity.setCountry(snapshot.country());
        orderDeliveryAddressRepository.save(entity);
    }

    private record DeliveryAddressSnapshot(String label, String line1, String line2, String city, String postcode, String country) {}
}
