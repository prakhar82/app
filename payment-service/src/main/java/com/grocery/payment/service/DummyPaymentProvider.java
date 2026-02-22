package com.grocery.payment.service;

import com.grocery.payment.dto.PaymentIntentRequest;
import com.grocery.payment.dto.PaymentIntentResponse;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class DummyPaymentProvider implements PaymentProvider {
    @Override
    public PaymentIntentResponse createIntent(PaymentIntentRequest request) {
        return new PaymentIntentResponse(request.orderRef(), "SUCCESS", "DUMMY-" + UUID.randomUUID().toString().substring(0, 8));
    }
}
