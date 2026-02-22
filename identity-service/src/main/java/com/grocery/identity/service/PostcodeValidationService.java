package com.grocery.identity.service;

import com.grocery.identity.dto.PostcodeValidationResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class PostcodeValidationService {
    private static final Pattern NL_POSTCODE = Pattern.compile("^(\\d{4})([A-Z]{2})$");

    private final int from;
    private final int to;

    public PostcodeValidationService(
            @Value("${app.postcode.allowed-numeric-from:5600}") int from,
            @Value("${app.postcode.allowed-numeric-to:5699}") int to) {
        this.from = from;
        this.to = to;
    }

    public PostcodeValidationResponse validate(String postcode, String country) {
        if (country == null || !"NL".equalsIgnoreCase(country.trim())) {
            return new PostcodeValidationResponse(false, null, "Only NL addresses are allowed", null);
        }
        String normalized = normalize(postcode);
        Matcher matcher = NL_POSTCODE.matcher(normalized);
        if (!matcher.matches()) {
            return new PostcodeValidationResponse(false, null, "Invalid postcode format. Use 1234AB", normalized);
        }
        int numeric = Integer.parseInt(matcher.group(1));
        if (numeric < from || numeric > to) {
            return new PostcodeValidationResponse(false, "Eindhoven", "Delivery available only for Eindhoven postcodes", normalized);
        }
        return new PostcodeValidationResponse(true, "Eindhoven", null, normalized);
    }

    public String normalize(String postcode) {
        return postcode == null ? "" : postcode.replace(" ", "").toUpperCase(Locale.ROOT);
    }
}
