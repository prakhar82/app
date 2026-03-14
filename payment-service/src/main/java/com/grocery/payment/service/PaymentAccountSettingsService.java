package com.grocery.payment.service;

import com.grocery.payment.domain.PaymentAccountSettingsEntity;
import com.grocery.payment.dto.PaymentAccountSettingsRequest;
import com.grocery.payment.dto.PaymentAccountSettingsResponse;
import com.grocery.payment.repo.PaymentAccountSettingsRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PaymentAccountSettingsService {
    private static final Long SETTINGS_ID = 1L;

    private final PaymentAccountSettingsRepository repository;

    public PaymentAccountSettingsService(PaymentAccountSettingsRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public PaymentAccountSettingsResponse get() {
        return toResponse(load());
    }

    @Transactional
    public PaymentAccountSettingsResponse update(PaymentAccountSettingsRequest request) {
        PaymentAccountSettingsEntity entity = load();
        entity.setAccountHolderName(blankToNull(request.accountHolderName()));
        entity.setIban(blankToNull(request.iban()));
        entity.setBankName(blankToNull(request.bankName()));
        entity.setPaymentReference(blankToNull(request.paymentReference()));
        return toResponse(repository.save(entity));
    }

    private PaymentAccountSettingsEntity load() {
        return repository.findById(SETTINGS_ID).orElseGet(() -> {
            PaymentAccountSettingsEntity entity = new PaymentAccountSettingsEntity();
            entity.setId(SETTINGS_ID);
            return repository.save(entity);
        });
    }

    private PaymentAccountSettingsResponse toResponse(PaymentAccountSettingsEntity entity) {
        return new PaymentAccountSettingsResponse(
                entity.getAccountHolderName(),
                entity.getIban(),
                entity.getBankName(),
                entity.getPaymentReference());
    }

    private String blankToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
