package com.grocery.identity.domain;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "users", indexes = {@Index(name = "idx_users_email", columnList = "email", unique = true)})
public class UserAccount {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true)
    private String email;
    @Column(nullable = false)
    private String passwordHash;
    @Column
    private String name;
    @Column
    private String phone;
    @Column
    private String preferredLanguage;
    @Column(nullable = false)
    private String role;
    @Column(nullable = false)
    private boolean googleVerified;
    @Column(nullable = false)
    private String status;
    @Column
    private String verificationCodeHash;
    @Column
    private Instant verificationExpiresAt;
    @Column(nullable = false)
    private int verificationAttempts;
    @Column
    private Instant lastCodeSentAt;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "default_address_id")
    private UserAddress defaultAddress;
    @Column(nullable = false)
    private Instant createdAt;
    @Column(nullable = false)
    private Instant updatedAt;

    @PrePersist
    void prePersist() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.status == null || this.status.isBlank()) {
            this.status = "ACTIVE";
        }
    }

    @PreUpdate
    void preUpdate() {
        this.updatedAt = Instant.now();
    }

    public Long getId() { return id; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getPreferredLanguage() { return preferredLanguage; }
    public void setPreferredLanguage(String preferredLanguage) { this.preferredLanguage = preferredLanguage; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public boolean isGoogleVerified() { return googleVerified; }
    public void setGoogleVerified(boolean googleVerified) { this.googleVerified = googleVerified; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getVerificationCodeHash() { return verificationCodeHash; }
    public void setVerificationCodeHash(String verificationCodeHash) { this.verificationCodeHash = verificationCodeHash; }
    public Instant getVerificationExpiresAt() { return verificationExpiresAt; }
    public void setVerificationExpiresAt(Instant verificationExpiresAt) { this.verificationExpiresAt = verificationExpiresAt; }
    public int getVerificationAttempts() { return verificationAttempts; }
    public void setVerificationAttempts(int verificationAttempts) { this.verificationAttempts = verificationAttempts; }
    public Instant getLastCodeSentAt() { return lastCodeSentAt; }
    public void setLastCodeSentAt(Instant lastCodeSentAt) { this.lastCodeSentAt = lastCodeSentAt; }
    public UserAddress getDefaultAddress() { return defaultAddress; }
    public void setDefaultAddress(UserAddress defaultAddress) { this.defaultAddress = defaultAddress; }
}
