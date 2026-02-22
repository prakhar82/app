package com.grocery.payment.service;

import com.grocery.payment.dto.PaymentIntentRequest;
import com.grocery.payment.dto.PaymentIntentResponse;

public interface PaymentProvider {
    PaymentIntentResponse createIntent(PaymentIntentRequest request);
}
