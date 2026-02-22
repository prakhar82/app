package com.grocery.identity.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class VerificationEmailService {
    private static final Logger log = LoggerFactory.getLogger(VerificationEmailService.class);

    private final JavaMailSender mailSender;
    private final String from;

    public VerificationEmailService(JavaMailSender mailSender,
                                    @Value("${app.mail.from:no-reply@grocery.local}") String from) {
        this.mailSender = mailSender;
        this.from = from;
    }

    public void sendVerificationCode(String toEmail, String code) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(from);
            message.setTo(toEmail);
            message.setSubject("Grocery Shop - Email verification code");
            message.setText("Your verification code is: " + code + "\nThis code expires in 15 minutes.");
            mailSender.send(message);
            log.info("Verification email sent successfully to {} from {}", toEmail, from);
        } catch (Exception ex) {
            log.warn("Failed to send verification email to {}: {}", toEmail, ex.getMessage());
        }
    }
}
