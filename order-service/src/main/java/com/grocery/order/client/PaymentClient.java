package com.grocery.order.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.Map;

@Component
public class PaymentClient {
    private final RestTemplate restTemplate;
    private final String paymentBase;

    public PaymentClient(RestTemplate restTemplate, @Value("${app.payment-base-url:http://payment-service:8086}") String paymentBase) {
        this.restTemplate = restTemplate;
        this.paymentBase = paymentBase;
    }

    public String pay(String orderRef, BigDecimal amount, String method) {
        var payload = Map.of("orderRef", orderRef, "amount", amount, "method", method);
        var response = restTemplate.postForEntity(paymentBase + "/payments/intent", payload, Map.class);
        return (String) response.getBody().get("status");
    }
}
