package com.grocery.identity.config;

import com.grocery.identity.domain.UserAccount;
import com.grocery.identity.repo.UserAccountRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DevSeedConfig {

    @Bean
    CommandLineRunner seedDevUsers(UserAccountRepository userAccountRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            seed(userAccountRepository, passwordEncoder, "admin@grocery.local", "Admin@123", "ADMIN");
            seed(userAccountRepository, passwordEncoder, "user@grocery.local", "User@123", "USER");
        };
    }

    private void seed(UserAccountRepository repo, PasswordEncoder encoder, String email, String rawPassword, String role) {
        repo.findByEmailIgnoreCase(email).orElseGet(() -> {
            UserAccount user = new UserAccount();
            user.setEmail(email);
            user.setPasswordHash(encoder.encode(rawPassword));
            user.setName(role + " User");
            user.setRole(role);
            user.setGoogleVerified(true);
            user.setStatus("ACTIVE");
            return repo.save(user);
        });
    }
}
