package com.grocery.identity.controller;

import com.grocery.identity.dto.PostcodeValidationResponse;
import com.grocery.identity.service.PostcodeValidationService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/postcode")
public class PostcodeController {
    private final PostcodeValidationService postcodeValidationService;

    public PostcodeController(PostcodeValidationService postcodeValidationService) {
        this.postcodeValidationService = postcodeValidationService;
    }

    @GetMapping("/validate")
    public PostcodeValidationResponse validate(@RequestParam("postcode") String postcode,
                                               @RequestParam(name = "country", defaultValue = "NL") String country) {
        return postcodeValidationService.validate(postcode, country);
    }
}
