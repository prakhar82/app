package com.grocery.payment.controller;

import com.grocery.payment.dto.PaymentIntentRequest;
import com.grocery.payment.dto.PaymentIntentResponse;
import com.grocery.payment.service.PaymentService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/payments")
public class PaymentController {
    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/intent")
    public PaymentIntentResponse createIntent(@RequestBody PaymentIntentRequest request) {
        return paymentService.createIntent(request);
    }

    @PostMapping("/webhook")
    public String webhook(@RequestBody Map<String, String> payload) {
        return paymentService.webhook(payload.get("orderRef"), payload.get("status"));
    }
}
