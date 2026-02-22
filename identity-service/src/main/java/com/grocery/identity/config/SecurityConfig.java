package com.grocery.identity.config;

import com.grocery.identity.service.AuthService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

import java.io.IOException;

@Configuration
public class SecurityConfig {

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http,
                                            AuthService authService,
                                            @Value("${app.auth-mode:DEV}") String authMode,
                                            @Value("${app.frontend-url:http://localhost:4200}") String frontendUrl) throws Exception {
        http.csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/v3/api-docs/**", "/v3/api-docs.yaml", "/swagger-ui/**", "/swagger-ui.html", "/actuator/**", "/auth/**", "/postcode/**", "/addresses/**").permitAll()
                        .anyRequest().permitAll())
                .httpBasic(basic -> basic.disable())
                .formLogin(form -> form.disable());

        if ("GOOGLE".equalsIgnoreCase(authMode)) {
            http.oauth2Login(oauth -> oauth.successHandler((request, response, authentication) ->
                    onOauthSuccess(request, response, authentication, authService, frontendUrl)));
        }
        return http.build();
    }

    private void onOauthSuccess(HttpServletRequest request,
                                HttpServletResponse response,
                                Authentication authentication,
                                AuthService authService,
                                String frontendUrl) throws IOException, ServletException {
        OAuth2User principal = (OAuth2User) authentication.getPrincipal();
        String email = principal.getAttribute("email");
        if (email == null || email.isBlank()) {
            email = authentication.getName();
        }
        var user = authService.upsertGoogleUser(email);
        var token = authService.issue(user).accessToken();
        response.addHeader("Set-Cookie", "access_token=" + token + "; HttpOnly; Path=/; SameSite=Lax");
        response.sendRedirect(frontendUrl + "/auth/callback");
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
