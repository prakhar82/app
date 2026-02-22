package com.grocery.identity.service;

import com.grocery.common.api.DomainException;
import com.grocery.common.security.JwtService;
import com.grocery.identity.domain.UserAccount;
import com.grocery.identity.dto.AuthResponse;
import com.grocery.identity.dto.LoginRequest;
import com.grocery.identity.dto.RegisterRequest;
import com.grocery.identity.dto.ResendCodeRequest;
import com.grocery.identity.dto.VerifyRequest;
import com.grocery.identity.repo.UserAccountRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class AuthService {
    private final UserAccountRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final VerificationEmailService verificationEmailService;
    private final JwtService jwtService;
    private final long expires;
    private final String authMode;
    private final int verificationExpiryMinutes;
    private final int maxVerificationAttempts;

    public AuthService(UserAccountRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       VerificationEmailService verificationEmailService,
                       @Value("${security.jwt.secret}") String secret,
                       @Value("${security.jwt.access-token-seconds:1800}") long expires,
                       @Value("${app.auth-mode:DEV}") String authMode,
                       @Value("${app.verification.expiry-minutes:15}") int verificationExpiryMinutes,
                       @Value("${app.verification.max-attempts:5}") int maxVerificationAttempts) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.verificationEmailService = verificationEmailService;
        this.jwtService = new JwtService(secret, expires);
        this.expires = expires;
        this.authMode = authMode;
        this.verificationExpiryMinutes = verificationExpiryMinutes;
        this.maxVerificationAttempts = maxVerificationAttempts;
    }

    public AuthResponse devLogin(LoginRequest request) {
        if (!"DEV".equalsIgnoreCase(authMode)) {
            throw new DomainException("AUTH_MODE_BLOCKED", "DEV login disabled in GOOGLE mode");
        }
        UserAccount user = userRepository.findByEmailIgnoreCase(normalizeEmail(request.email()))
                .orElseThrow(() -> new DomainException("INVALID_CREDENTIALS", "Invalid email/password"));
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new DomainException("INVALID_CREDENTIALS", "Invalid email/password");
        }
        if (!"ACTIVE".equalsIgnoreCase(user.getStatus())) {
            try {
                resendVerificationForPendingUser(user);
                throw new DomainException("ACCOUNT_NOT_ACTIVE", "Account not verified. A new verification code has been sent.");
            } catch (DomainException ex) {
                throw new DomainException("ACCOUNT_NOT_ACTIVE", "Account not verified. Please verify your email.");
            }
        }
        return issue(user);
    }

    public void register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        UserAccount existing = userRepository.findByEmailIgnoreCase(email).orElse(null);
        if (existing != null) {
            if ("ACTIVE".equalsIgnoreCase(existing.getStatus())) {
                throw new DomainException("EMAIL_EXISTS", "Email already registered");
            }
            existing.setName(request.name());
            existing.setPhone(request.phone());
            if (request.password() != null && !request.password().isBlank()) {
                existing.setPasswordHash(passwordEncoder.encode(request.password()));
            }
            resendVerificationForPendingUser(existing);
            return;
        }
        if (!"DEV".equalsIgnoreCase(authMode)) {
            throw new DomainException("AUTH_MODE_BLOCKED", "Direct registration is only available in DEV mode");
        }
        if (request.password() == null || request.password().isBlank()) {
            throw new DomainException("PASSWORD_REQUIRED", "Password is required");
        }

        UserAccount user = new UserAccount();
        user.setEmail(email);
        user.setName(request.name());
        user.setPhone(request.phone());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole("USER");
        user.setGoogleVerified(false);
        user.setStatus("PENDING_VERIFICATION");
        issueAndSendVerificationCode(user);
        userRepository.save(user);
    }

    public void verify(VerifyRequest request) {
        UserAccount user = userRepository.findByEmailIgnoreCase(normalizeEmail(request.email()))
                .orElseThrow(() -> new DomainException("NOT_FOUND", "User not found"));
        if ("ACTIVE".equalsIgnoreCase(user.getStatus())) {
            return;
        }
        if (user.getVerificationExpiresAt() == null || Instant.now().isAfter(user.getVerificationExpiresAt())) {
            throw new DomainException("CODE_EXPIRED", "Verification code expired. Please request a new code");
        }
        if (user.getVerificationAttempts() >= maxVerificationAttempts) {
            throw new DomainException("MAX_ATTEMPTS_REACHED", "Too many attempts. Please request a new code");
        }
        if (!passwordEncoder.matches(request.code(), user.getVerificationCodeHash())) {
            user.setVerificationAttempts(user.getVerificationAttempts() + 1);
            userRepository.save(user);
            throw new DomainException("INVALID_CODE", "Invalid verification code");
        }
        user.setStatus("ACTIVE");
        user.setVerificationCodeHash(null);
        user.setVerificationExpiresAt(null);
        user.setVerificationAttempts(0);
        userRepository.save(user);
    }

    public void resend(ResendCodeRequest request) {
        UserAccount user = userRepository.findByEmailIgnoreCase(normalizeEmail(request.email()))
                .orElseThrow(() -> new DomainException("NOT_FOUND", "User not found"));
        if ("ACTIVE".equalsIgnoreCase(user.getStatus())) {
            return;
        }
        resendVerificationForPendingUser(user);
    }

    public AuthResponse issue(UserAccount user) {
        String token = jwtService.issueAccessToken(
                user.getEmail(),
                List.of("ROLE_" + user.getRole()),
                Map.of("uid", user.getId()));
        return new AuthResponse(token, "Bearer", expires, user.getRole(), user.getEmail());
    }

    public UserAccount upsertGoogleUser(String email) {
        String normalizedEmail = normalizeEmail(email);
        return userRepository.findByEmailIgnoreCase(normalizedEmail).orElseGet(() -> {
            UserAccount u = new UserAccount();
            u.setEmail(normalizedEmail);
            u.setPasswordHash("GOOGLE_AUTH_ONLY");
            u.setRole("USER");
            u.setGoogleVerified(true);
            u.setStatus("ACTIVE");
            return userRepository.save(u);
        });
    }

    private void issueAndSendVerificationCode(UserAccount user) {
        String rawCode = String.format("%06d", ThreadLocalRandom.current().nextInt(0, 1_000_000));
        user.setVerificationCodeHash(passwordEncoder.encode(rawCode));
        user.setVerificationExpiresAt(Instant.now().plus(verificationExpiryMinutes, ChronoUnit.MINUTES));
        user.setVerificationAttempts(0);
        user.setLastCodeSentAt(Instant.now());
        verificationEmailService.sendVerificationCode(user.getEmail(), rawCode);
    }

    private void resendVerificationForPendingUser(UserAccount user) {
        if (user.getLastCodeSentAt() != null && user.getLastCodeSentAt().isAfter(Instant.now().minus(60, ChronoUnit.SECONDS))) {
            throw new DomainException("RATE_LIMITED", "Please wait before requesting another code");
        }
        issueAndSendVerificationCode(user);
        userRepository.save(user);
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }
}
