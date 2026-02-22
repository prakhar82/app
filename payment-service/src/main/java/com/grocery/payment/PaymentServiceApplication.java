package com.grocery.payment;

import com.grocery.common.web.CorrelationIdFilter;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;

@SpringBootApplication(scanBasePackages = {"com.grocery.payment", "com.grocery.common"})
public class PaymentServiceApplication {
    public static void main(String[] args) { SpringApplication.run(PaymentServiceApplication.class, args); }

    @Bean
    FilterRegistrationBean<CorrelationIdFilter> correlationFilter() {
        return new FilterRegistrationBean<>(new CorrelationIdFilter());
    }
}
