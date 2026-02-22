package com.grocery.gateway.filter;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Component
public class CorrelationIdGlobalFilter implements GlobalFilter, Ordered {
    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String corr = exchange.getRequest().getHeaders().getFirst("X-Correlation-Id");
        if (corr == null || corr.isBlank()) {
            corr = UUID.randomUUID().toString();
        }
        exchange.getResponse().getHeaders().add("X-Correlation-Id", corr);
        return chain.filter(exchange);
    }

    @Override
    public int getOrder() {
        return -1;
    }
}
