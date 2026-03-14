package com.grocery.order.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;

@Component
public class PaymentClient {
    private final RestTemplate restTemplate;
    private final String paymentBase;

    public PaymentClient(RestTemplate restTemplate, @Value("${app.payment-base-url:http://payment-service:8086}") String paymentBase) {
        this.restTemplate = restTemplate;
        this.paymentBase = paymentBase;
    }

    public PaymentIntent pay(String orderRef, BigDecimal amount, String method) {
        var payload = new PaymentIntentRequest(orderRef, amount, method);
        return restTemplate.postForObject(paymentBase + "/payments/intent", payload, PaymentIntent.class);
    }

    public PaymentStatus verify(String providerRef) {
        return restTemplate.getForObject(paymentBase + "/payments/session/" + providerRef, PaymentStatus.class);
    }

    public record PaymentIntent(String orderRef, String status, String providerRef, String redirectUrl) {
    }

    public record PaymentIntentRequest(String orderRef, BigDecimal amount, String method) {
    }

    public record PaymentStatus(String providerRef, String status, String paymentStatus, boolean paid) {
    }
}
