package com.grocery.identity.service;

import com.grocery.common.api.DomainException;
import com.grocery.identity.domain.UserAccount;
import com.grocery.identity.dto.ChangePasswordRequest;
import com.grocery.identity.repo.UserAccountRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PasswordService {
    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;

    public PasswordService(UserAccountRepository userAccountRepository, PasswordEncoder passwordEncoder) {
        this.userAccountRepository = userAccountRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public void changePassword(String email, ChangePasswordRequest request) {
        UserAccount user = userAccountRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new DomainException("UNAUTHORIZED", "Unknown user"));
        if ("GOOGLE_AUTH_ONLY".equals(user.getPasswordHash())) {
            throw new DomainException("PASSWORD_CHANGE_NOT_ALLOWED", "Password change is not available for Google-only accounts");
        }
        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new DomainException("INVALID_CREDENTIALS", "Current password is incorrect");
        }
        if (request.currentPassword().equals(request.newPassword())) {
            throw new DomainException("PASSWORD_UNCHANGED", "New password must be different from current password");
        }
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userAccountRepository.save(user);
    }
}
