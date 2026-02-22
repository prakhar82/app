package com.grocery.order;

import com.grocery.common.web.CorrelationIdFilter;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;

@SpringBootApplication(scanBasePackages = {"com.grocery.order", "com.grocery.common"})
public class OrderServiceApplication {
    public static void main(String[] args) { SpringApplication.run(OrderServiceApplication.class, args); }

    @Bean
    FilterRegistrationBean<CorrelationIdFilter> correlationFilter() {
        return new FilterRegistrationBean<>(new CorrelationIdFilter());
    }
}
