package com.grocery.payment.service;

import com.grocery.payment.dto.PaymentIntentRequest;
import com.grocery.payment.dto.PaymentIntentResponse;
import com.grocery.payment.dto.PaymentSessionStatusResponse;

public interface PaymentProvider {
    PaymentIntentResponse createIntent(PaymentIntentRequest request);
    PaymentSessionStatusResponse getSessionStatus(String providerRef);
}
