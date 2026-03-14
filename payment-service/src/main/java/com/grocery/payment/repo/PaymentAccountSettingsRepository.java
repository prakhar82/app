package com.grocery.payment.repo;

import com.grocery.payment.domain.PaymentAccountSettingsEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentAccountSettingsRepository extends JpaRepository<PaymentAccountSettingsEntity, Long> {
}
