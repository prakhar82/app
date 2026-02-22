package com.grocery.cart.client;

import com.grocery.common.api.DomainException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Component
public class InventoryClient {
    private final RestTemplate restTemplate;
    private final String inventoryBaseUrl;

    public InventoryClient(RestTemplate restTemplate,
                           @Value("${inventory.base-url:http://inventory-service:8083}") String inventoryBaseUrl) {
        this.restTemplate = restTemplate;
        this.inventoryBaseUrl = inventoryBaseUrl;
    }

    public void reserveCart(String userEmail, String sku, int qty) {
        post("/inventory/cart/reserve", userEmail, sku, qty);
    }

    public void releaseCart(String userEmail, String sku, int qty) {
        post("/inventory/cart/release", userEmail, sku, qty);
    }

    private void post(String path, String userEmail, String sku, int qty) {
        try {
            HttpEntity<Map<String, Object>> req = new HttpEntity<>(Map.of(
                    "userEmail", userEmail,
                    "sku", sku,
                    "quantity", qty
            ));
            restTemplate.postForEntity(inventoryBaseUrl + path, req, Void.class);
        } catch (org.springframework.web.client.HttpStatusCodeException ex) {
            HttpStatusCode status = ex.getStatusCode();
            String message = ex.getResponseBodyAsString();
            throw new DomainException("INVENTORY_ERROR", "Inventory operation failed (" + status + "): " + message);
        }
    }
}
