package com.grocery.gateway.filter;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequestDecorator;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
public class JwtAuthGlobalFilter implements org.springframework.cloud.gateway.filter.GlobalFilter, Ordered {

    private final byte[] secret;
    private final List<String> protectedPrefixes = List.of("/api/cart", "/api/orders", "/api/inventory", "/api/payments", "/api/identity/addresses", "/api/identity/me");

    public JwtAuthGlobalFilter(@Value("${JWT_SECRET:replace-with-very-strong-32-char-secret}") String secret) {
        this.secret = secret.getBytes(StandardCharsets.UTF_8);
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, org.springframework.cloud.gateway.filter.GatewayFilterChain chain) {
        String path = exchange.getRequest().getURI().getPath();
        if (HttpMethod.OPTIONS.equals(exchange.getRequest().getMethod())) {
            return chain.filter(exchange);
        }
        boolean requiresAuth = protectedPrefixes.stream().anyMatch(path::startsWith);
        boolean isOpenApi = path.endsWith("/v3/api-docs")
                || path.endsWith("/v3/api-docs.yaml")
                || path.contains("/swagger-ui");
        if (isOpenApi) {
            return chain.filter(exchange);
        }
        if (!requiresAuth) {
            return chain.filter(exchange);
        }

        String auth = exchange.getRequest().getHeaders().getFirst("Authorization");
        if (auth == null || !auth.startsWith("Bearer ")) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }

        try {
            String token = auth.substring(7);
            var claims = Jwts.parser().verifyWith(Keys.hmacShaKeyFor(secret)).build().parseSignedClaims(token).getPayload();

            String subject = claims.getSubject();
            List<String> roles = extractRoles(claims);
            if (requiresAdmin(path) && !roles.contains("ROLE_ADMIN")) {
                exchange.getResponse().setStatusCode(HttpStatus.FORBIDDEN);
                return exchange.getResponse().setComplete();
            }

            HttpHeaders forwardedHeaders = new HttpHeaders();
            forwardedHeaders.putAll(exchange.getRequest().getHeaders());
            forwardedHeaders.set("X-User-Email", subject == null ? "" : subject);
            forwardedHeaders.set("X-User-Roles", String.join(",", roles));
            var decoratedRequest = new ServerHttpRequestDecorator(exchange.getRequest()) {
                @Override
                public HttpHeaders getHeaders() {
                    return forwardedHeaders;
                }
            };
            return chain.filter(exchange.mutate().request(decoratedRequest).build());
        } catch (Exception ex) {
            System.err.println("JWT filter failure on path=" + path + " error=" + ex.getClass().getSimpleName() + ": " + ex.getMessage());
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }
    }

    private boolean requiresAdmin(String path) {
        return path.startsWith("/api/orders/orders/admin")
                || path.startsWith("/api/inventory/inventory/admin")
                || path.startsWith("/api/catalog/catalog/admin")
                || (path.startsWith("/api/orders/orders/") && path.endsWith("/status"));
    }

    private List<String> extractRoles(Map<String, Object> claims) {
        Object raw = claims.get("roles");
        if (raw instanceof List<?> list) {
            List<String> roles = new ArrayList<>();
            for (Object v : list) {
                if (v != null) {
                    roles.add(String.valueOf(v));
                }
            }
            return roles;
        }
        return List.of();
    }

    @Override
    public int getOrder() {
        return 0;
    }
}
