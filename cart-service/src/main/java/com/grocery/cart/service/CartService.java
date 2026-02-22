package com.grocery.cart.service;

import com.grocery.cart.client.InventoryClient;
import com.grocery.cart.domain.CartItem;
import com.grocery.cart.dto.UpsertCartItemRequest;
import com.grocery.cart.repo.CartItemRepository;
import com.grocery.common.api.DomainException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CartService {
    private final CartItemRepository cartItemRepository;
    private final InventoryClient inventoryClient;

    public CartService(CartItemRepository cartItemRepository, InventoryClient inventoryClient) {
        this.cartItemRepository = cartItemRepository;
        this.inventoryClient = inventoryClient;
    }

    @Transactional(readOnly = true)
    public List<CartItem> list(String email) {
        return cartItemRepository.findByUserEmail(email);
    }

    @Transactional
    public CartItem upsert(UpsertCartItemRequest request) {
        if (request.quantity() < 0) {
            throw new DomainException("INVALID_QTY", "Quantity must be >= 0");
        }

        CartItem existing = cartItemRepository.findByUserEmailAndSku(request.userEmail(), request.sku()).orElse(null);
        int oldQty = existing == null ? 0 : existing.getQuantity();
        int delta = request.quantity() - oldQty;

        if (delta > 0) {
            inventoryClient.reserveCart(request.userEmail(), request.sku(), delta);
        } else if (delta < 0) {
            inventoryClient.releaseCart(request.userEmail(), request.sku(), -delta);
        }

        if (request.quantity() == 0) {
            if (existing != null) {
                cartItemRepository.delete(existing);
            }
            return null;
        }

        CartItem entity = existing == null ? new CartItem() : existing;
        entity.setUserEmail(request.userEmail());
        entity.setSku(request.sku());
        entity.setItemName(request.itemName());
        entity.setQuantity(request.quantity());
        return cartItemRepository.save(entity);
    }

    @Transactional
    public void delete(String userEmail, String sku) {
        CartItem existing = cartItemRepository.findByUserEmailAndSku(userEmail, sku).orElse(null);
        if (existing == null) {
            return;
        }
        inventoryClient.releaseCart(userEmail, sku, existing.getQuantity());
        cartItemRepository.delete(existing);
    }
}
