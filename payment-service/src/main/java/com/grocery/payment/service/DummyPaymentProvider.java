package com.grocery.payment.service;

import com.grocery.payment.dto.PaymentIntentRequest;
import com.grocery.payment.dto.PaymentIntentResponse;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class DummyPaymentProvider implements PaymentProvider {
    @Override
    public PaymentIntentResponse createIntent(PaymentIntentRequest request) {
        String method = request.method() == null ? "ONLINE" : request.method().trim().toUpperCase();
        String prefix = "IDEAL".equals(method) ? "IDEAL" : "DUMMY";
        return new PaymentIntentResponse(request.orderRef(), "SUCCESS", prefix + "-" + UUID.randomUUID().toString().substring(0, 8));
    }
}
