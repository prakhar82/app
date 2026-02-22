package com.grocery.inventory.repo;

import com.grocery.inventory.domain.StockReservation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface StockReservationRepository extends JpaRepository<StockReservation, Long> {
    List<StockReservation> findByOrderRefAndStatus(String orderRef, String status);
    List<StockReservation> findByStatusAndExpiresAtBefore(String status, Instant now);
    Optional<StockReservation> findByOrderRefAndSkuAndStatus(String orderRef, String sku, String status);
}
