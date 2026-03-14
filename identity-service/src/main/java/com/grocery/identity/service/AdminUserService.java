package com.grocery.identity.service;

import com.grocery.common.api.DomainException;
import com.grocery.identity.domain.UserAccount;
import com.grocery.identity.dto.AdminCreateUserRequest;
import com.grocery.identity.dto.AdminUserResponse;
import com.grocery.identity.repo.UserAccountRepository;
import com.grocery.identity.repo.UserAddressRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AdminUserService {
    private final UserAccountRepository userAccountRepository;
    private final UserAddressRepository userAddressRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminUserService(UserAccountRepository userAccountRepository,
                            UserAddressRepository userAddressRepository,
                            PasswordEncoder passwordEncoder) {
        this.userAccountRepository = userAccountRepository;
        this.userAddressRepository = userAddressRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<AdminUserResponse> listUsers() {
        return userAccountRepository.findAll().stream()
                .map(user -> new AdminUserResponse(
                        user.getId(),
                        user.getEmail(),
                        user.getName(),
                        user.getPhone(),
                        user.getRole(),
                        user.getStatus(),
                        user.isGoogleVerified(),
                        user.getCreatedAt()))
                .toList();
    }

    @Transactional
    public void deleteUser(Long id, String authenticatedEmail) {
        var user = userAccountRepository.findById(id)
                .orElseThrow(() -> new DomainException("USER_NOT_FOUND", "User not found"));
        if (authenticatedEmail != null && authenticatedEmail.equalsIgnoreCase(user.getEmail())) {
            throw new DomainException("SELF_DELETE_BLOCKED", "Admin cannot delete the currently logged-in account");
        }
        user.setDefaultAddress(null);
        userAccountRepository.save(user);
        userAddressRepository.deleteByUserId(id);
        userAccountRepository.delete(user);
    }

    @Transactional
    public AdminUserResponse createUser(AdminCreateUserRequest request) {
        String email = normalizeEmail(request.email());
        if (userAccountRepository.findByEmailIgnoreCase(email).isPresent()) {
            throw new DomainException("EMAIL_EXISTS", "Email already registered");
        }

        UserAccount user = new UserAccount();
        user.setEmail(email);
        user.setName(blankToNull(request.name()));
        user.setPhone(blankToNull(request.phone()));
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(request.role() == null || request.role().isBlank() ? "USER" : request.role());
        user.setGoogleVerified(false);
        user.setStatus("ACTIVE");

        UserAccount saved = userAccountRepository.save(user);
        return new AdminUserResponse(
                saved.getId(),
                saved.getEmail(),
                saved.getName(),
                saved.getPhone(),
                saved.getRole(),
                saved.getStatus(),
                saved.isGoogleVerified(),
                saved.getCreatedAt());
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    private String blankToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
