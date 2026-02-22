package com.grocery.cart.controller;

import com.grocery.cart.domain.CartItem;
import com.grocery.cart.dto.UpsertCartItemRequest;
import com.grocery.cart.service.CartService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/cart")
public class CartController {
    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @GetMapping("/{email}")
    public List<CartItem> list(@PathVariable("email") String email) {
        return cartService.list(email);
    }

    @PostMapping("/items")
    public CartItem upsert(@Valid @RequestBody UpsertCartItemRequest request) {
        return cartService.upsert(request);
    }

    @DeleteMapping("/{email}/{sku}")
    public void delete(@PathVariable("email") String email, @PathVariable("sku") String sku) {
        cartService.delete(email, sku);
    }
}
