package com.grocery.order.service;

import com.grocery.order.domain.OrderEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class OrderNotificationService {
    private static final Logger log = LoggerFactory.getLogger(OrderNotificationService.class);

    private final JavaMailSender mailSender;
    private final String from;

    public OrderNotificationService(JavaMailSender mailSender,
                                    @Value("${app.mail.from:no-reply@grocery.local}") String from) {
        this.mailSender = mailSender;
        this.from = from;
    }

    public void sendOrderRejectedEmail(OrderEntity order) {
        if (order.getUserEmail() == null || order.getUserEmail().isBlank()) {
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(from);
            message.setTo(order.getUserEmail());
            message.setSubject("Grocery Shop - Order rejected");
            message.setText("""
                    Your order %s was rejected.

                    Reason: %s

                    Please review the order in your account, adjust it, and resubmit if needed.
                    """.formatted(order.getOrderRef(), safeReason(order.getRejectionComment())));
            mailSender.send(message);
            log.info("Rejected order email sent for {}", order.getOrderRef());
        } catch (Exception ex) {
            log.warn("Failed to send rejected order email for {}: {}", order.getOrderRef(), ex.getMessage());
        }
    }

    private String safeReason(String reason) {
        return reason == null || reason.isBlank() ? "No reason provided." : reason;
    }
}
