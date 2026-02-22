package com.grocery.identity.controller;

import com.grocery.identity.dto.AuthResponse;
import com.grocery.identity.dto.LoginRequest;
import com.grocery.identity.dto.RegisterRequest;
import com.grocery.identity.dto.ResendCodeRequest;
import com.grocery.identity.dto.VerifyRequest;
import com.grocery.identity.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.devLogin(request));
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public void register(@Valid @RequestBody RegisterRequest request) {
        authService.register(request);
    }

    @PostMapping("/verify")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void verify(@Valid @RequestBody VerifyRequest request) {
        authService.verify(request);
    }

    @PostMapping("/resend-code")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public void resend(@Valid @RequestBody ResendCodeRequest request) {
        authService.resend(request);
    }

    @GetMapping("/health")
    public String health() {
        return "ok";
    }
}
