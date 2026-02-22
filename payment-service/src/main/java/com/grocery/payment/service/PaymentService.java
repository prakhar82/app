package com.grocery.payment.service;

import com.grocery.payment.domain.PaymentEntity;
import com.grocery.payment.dto.PaymentIntentRequest;
import com.grocery.payment.dto.PaymentIntentResponse;
import com.grocery.payment.repo.PaymentRepository;
import org.springframework.stereotype.Service;

@Service
public class PaymentService {
    private final PaymentProvider paymentProvider;
    private final PaymentRepository paymentRepository;

    public PaymentService(PaymentProvider paymentProvider, PaymentRepository paymentRepository) {
        this.paymentProvider = paymentProvider;
        this.paymentRepository = paymentRepository;
    }

    public PaymentIntentResponse createIntent(PaymentIntentRequest request) {
        PaymentIntentResponse response = paymentProvider.createIntent(request);
        PaymentEntity entity = new PaymentEntity();
        entity.setOrderRef(request.orderRef());
        entity.setMethod(request.method());
        entity.setAmount(request.amount());
        entity.setStatus(response.status());
        paymentRepository.save(entity);
        return response;
    }

    public String webhook(String orderRef, String status) {
        return "Webhook accepted for " + orderRef + " -> " + status;
    }
}
