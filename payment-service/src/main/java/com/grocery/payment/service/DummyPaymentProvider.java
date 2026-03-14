package com.grocery.payment.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.grocery.common.api.DomainException;
import com.grocery.payment.dto.PaymentIntentRequest;
import com.grocery.payment.dto.PaymentIntentResponse;
import com.grocery.payment.dto.PaymentSessionStatusResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Component
public class DummyPaymentProvider implements PaymentProvider {
    private final RestTemplate restTemplate = new RestTemplate();
    private final String stripeSecretKey;
    private final String publicBaseUrl;

    public DummyPaymentProvider(@Value("${STRIPE_SECRET_KEY:}") String stripeSecretKey,
                                @Value("${FRONTEND_URL:http://localhost:8080}") String publicBaseUrl) {
        this.stripeSecretKey = stripeSecretKey == null ? "" : stripeSecretKey.trim();
        this.publicBaseUrl = publicBaseUrl == null || publicBaseUrl.isBlank() ? "http://localhost:8080" : publicBaseUrl.trim();
    }

    @Override
    public PaymentIntentResponse createIntent(PaymentIntentRequest request) {
        String method = request.method() == null ? "" : request.method().trim().toUpperCase();
        if (!"IDEAL".equals(method)) {
            throw new DomainException("PAYMENT_METHOD_NOT_SUPPORTED", "Only IDEAL is supported for online payments");
        }
        if (stripeSecretKey.isBlank()) {
            throw new DomainException("PAYMENT_PROVIDER_NOT_CONFIGURED", "Stripe secret key is not configured");
        }

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("mode", "payment");
        form.add("payment_method_types[0]", "ideal");
        form.add("line_items[0][price_data][currency]", "eur");
        form.add("line_items[0][price_data][product_data][name]", "Order " + request.orderRef());
        form.add("line_items[0][price_data][unit_amount]", toMinorUnits(request.amount()));
        form.add("line_items[0][quantity]", "1");
        form.add("success_url", publicBaseUrl + "/app/checkout?result=success&orderRef=" + request.orderRef() + "&sessionId={CHECKOUT_SESSION_ID}");
        form.add("cancel_url", publicBaseUrl + "/app/checkout?result=cancelled&orderRef=" + request.orderRef());
        form.add("metadata[orderRef]", request.orderRef());

        JsonNode response = restTemplate.postForObject(
                "https://api.stripe.com/v1/checkout/sessions",
                new HttpEntity<>(form, authHeaders()),
                JsonNode.class);

        if (response == null || response.path("id").asText().isBlank() || response.path("url").asText().isBlank()) {
            throw new DomainException("PAYMENT_PROVIDER_ERROR", "Stripe checkout session could not be created");
        }

        return new PaymentIntentResponse(
                request.orderRef(),
                "REQUIRES_ACTION",
                response.path("id").asText(),
                response.path("url").asText());
    }

    @Override
    public PaymentSessionStatusResponse getSessionStatus(String providerRef) {
        if (stripeSecretKey.isBlank()) {
            throw new DomainException("PAYMENT_PROVIDER_NOT_CONFIGURED", "Stripe secret key is not configured");
        }
        JsonNode response = restTemplate.exchange(
                "https://api.stripe.com/v1/checkout/sessions/" + providerRef,
                HttpMethod.GET,
                new HttpEntity<>(authHeaders()),
                JsonNode.class).getBody();

        if (response == null) {
            throw new DomainException("PAYMENT_PROVIDER_ERROR", "Stripe session lookup failed");
        }

        String status = response.path("status").asText();
        String paymentStatus = response.path("payment_status").asText();
        boolean paid = "paid".equalsIgnoreCase(paymentStatus) || "complete".equalsIgnoreCase(status);
        return new PaymentSessionStatusResponse(providerRef, status, paymentStatus, paid);
    }

    private HttpHeaders authHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        String basic = Base64.getEncoder().encodeToString((stripeSecretKey + ":").getBytes(StandardCharsets.UTF_8));
        headers.set(HttpHeaders.AUTHORIZATION, "Basic " + basic);
        return headers;
    }

    private String toMinorUnits(BigDecimal amount) {
        return amount.multiply(BigDecimal.valueOf(100))
                .setScale(0, RoundingMode.HALF_UP)
                .toPlainString();
    }
}
