package com.grocery.order.client;

import com.grocery.order.dto.CheckoutRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Component
public class InventoryClient {
    private final RestTemplate restTemplate;
    private final String inventoryBase;

    public InventoryClient(RestTemplate restTemplate, @Value("${app.inventory-base-url:http://inventory-service:8083}") String inventoryBase) {
        this.restTemplate = restTemplate;
        this.inventoryBase = inventoryBase;
    }

    public void reserve(String orderRef, List<CheckoutRequest.Item> items) {
        var payload = Map.of("orderRef", orderRef,
                "items", items.stream().map(i -> Map.of("sku", i.sku(), "quantity", i.qty())).toList());
        restTemplate.postForEntity(inventoryBase + "/inventory/reserve?holdMinutes=15", new HttpEntity<>(payload), String.class);
    }

    public void commit(String orderRef) {
        restTemplate.postForEntity(inventoryBase + "/inventory/commit/" + orderRef, HttpEntity.EMPTY, Void.class);
    }

    public void release(String orderRef) {
        restTemplate.postForEntity(inventoryBase + "/inventory/release/" + orderRef, HttpEntity.EMPTY, Void.class);
    }
}
