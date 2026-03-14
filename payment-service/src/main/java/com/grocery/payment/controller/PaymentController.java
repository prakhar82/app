package com.grocery.payment.controller;

import com.grocery.payment.dto.PaymentIntentRequest;
import com.grocery.payment.dto.PaymentIntentResponse;
import com.grocery.payment.dto.PaymentAccountSettingsRequest;
import com.grocery.payment.dto.PaymentAccountSettingsResponse;
import com.grocery.payment.service.PaymentAccountSettingsService;
import com.grocery.payment.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/payments")
public class PaymentController {
    private final PaymentService paymentService;
    private final PaymentAccountSettingsService paymentAccountSettingsService;

    public PaymentController(PaymentService paymentService, PaymentAccountSettingsService paymentAccountSettingsService) {
        this.paymentService = paymentService;
        this.paymentAccountSettingsService = paymentAccountSettingsService;
    }

    @PostMapping("/intent")
    public PaymentIntentResponse createIntent(@RequestBody PaymentIntentRequest request) {
        return paymentService.createIntent(request);
    }

    @PostMapping("/webhook")
    public String webhook(@RequestBody Map<String, String> payload) {
        return paymentService.webhook(payload.get("orderRef"), payload.get("status"));
    }

    @GetMapping("/admin/account")
    public PaymentAccountSettingsResponse getAccountSettings() {
        return paymentAccountSettingsService.get();
    }

    @PatchMapping("/admin/account")
    public PaymentAccountSettingsResponse updateAccountSettings(@Valid @RequestBody PaymentAccountSettingsRequest request) {
        return paymentAccountSettingsService.update(request);
    }
}
