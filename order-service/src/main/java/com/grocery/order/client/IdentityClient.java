package com.grocery.order.client;

import com.grocery.common.api.DomainException;
import com.grocery.order.dto.CheckoutRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
public class IdentityClient {
    private final RestTemplate restTemplate;
    private final String baseUrl;

    public IdentityClient(RestTemplate restTemplate,
                          @Value("${app.identity-base-url:http://identity-service:8081}") String baseUrl) {
        this.restTemplate = restTemplate;
        this.baseUrl = baseUrl;
    }

    public AddressResponse getAddress(String userEmail, Long addressId) {
        HttpEntity<Void> entity = new HttpEntity<>(headersForUser(userEmail));
        ResponseEntity<AddressResponse> response = restTemplate.exchange(
                baseUrl + "/addresses/" + addressId,
                HttpMethod.GET,
                entity,
                AddressResponse.class
        );
        if (response.getBody() == null) {
            throw new DomainException("ADDRESS_NOT_FOUND", "Address not found");
        }
        return response.getBody();
    }

    public AddressResponse createAddress(String userEmail, CheckoutRequest.AddressInput address) {
        HttpEntity<CheckoutRequest.AddressInput> entity = new HttpEntity<>(address, headersForUser(userEmail));
        ResponseEntity<AddressResponse> response = restTemplate.exchange(
                baseUrl + "/addresses",
                HttpMethod.POST,
                entity,
                AddressResponse.class
        );
        if (response.getBody() == null) {
            throw new DomainException("ADDRESS_CREATE_FAILED", "Address create failed");
        }
        return response.getBody();
    }

    public PostcodeValidationResponse validatePostcode(String postcode, String country) {
        String url = baseUrl + "/postcode/validate?postcode={postcode}&country={country}";
        ResponseEntity<PostcodeValidationResponse> response = restTemplate.getForEntity(url, PostcodeValidationResponse.class, postcode, country);
        if (response.getBody() == null) {
            throw new DomainException("POSTCODE_VALIDATION_FAILED", "Postcode validation failed");
        }
        return response.getBody();
    }

    private HttpHeaders headersForUser(String userEmail) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-User-Email", userEmail);
        return headers;
    }

    public record AddressResponse(
            Long id,
            String label,
            String line1,
            String line2,
            String city,
            String postcode,
            String country,
            boolean isDefault
    ) {}

    public record PostcodeValidationResponse(
            boolean allowed,
            String city,
            String reason,
            String normalizedPostcode
    ) {}
}
