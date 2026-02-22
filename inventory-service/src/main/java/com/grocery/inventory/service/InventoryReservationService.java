package com.grocery.inventory.service;

import com.grocery.common.api.DomainException;
import com.grocery.inventory.domain.InventoryItem;
import com.grocery.inventory.domain.StockReservation;
import com.grocery.inventory.dto.CartReservationRequest;
import com.grocery.inventory.dto.InventoryAdjustmentRequest;
import com.grocery.inventory.dto.InventoryUpsertRequest;
import com.grocery.inventory.dto.LowStockItemResponse;
import com.grocery.inventory.dto.ReservationItem;
import com.grocery.inventory.dto.ReserveRequest;
import com.grocery.inventory.repo.InventoryRepository;
import com.grocery.inventory.repo.StockReservationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class InventoryReservationService {
    private final InventoryRepository inventoryRepository;
    private final StockReservationRepository reservationRepository;

    public InventoryReservationService(InventoryRepository inventoryRepository, StockReservationRepository reservationRepository) {
        this.inventoryRepository = inventoryRepository;
        this.reservationRepository = reservationRepository;
    }

    @Transactional
    public String reserve(ReserveRequest request, int holdMinutes) {
        releaseExpired();
        Instant expiresAt = Instant.now().plusSeconds(holdMinutes * 60L);
        for (ReservationItem item : request.items()) {
            InventoryItem inv = inventoryRepository.lockBySku(item.sku())
                    .orElseThrow(() -> new DomainException("INV_NOT_FOUND", "No inventory for SKU " + item.sku()));
            if (inv.getAvailableQty() < item.quantity()) {
                throw new DomainException("INSUFFICIENT_STOCK", "Not enough stock for " + item.sku());
            }
            inv.setReservedQty(inv.getReservedQty() + item.quantity());
            inventoryRepository.save(inv);

            StockReservation reservation = new StockReservation();
            reservation.setOrderRef(request.orderRef());
            reservation.setSku(item.sku());
            reservation.setQuantity(item.quantity());
            reservation.setStatus("RESERVED");
            reservation.setExpiresAt(expiresAt);
            reservationRepository.save(reservation);
        }
        return "RESERVED";
    }

    @Transactional
    public void commit(String orderRef) {
        var reservations = reservationRepository.findByOrderRefAndStatus(orderRef, "RESERVED");
        for (StockReservation reservation : reservations) {
            InventoryItem inv = inventoryRepository.lockBySku(reservation.getSku())
                    .orElseThrow(() -> new DomainException("INV_NOT_FOUND", "No inventory for SKU " + reservation.getSku()));
            inv.setReservedQty(inv.getReservedQty() - reservation.getQuantity());
            inv.setTotalQty(inv.getTotalQty() - reservation.getQuantity());
            inventoryRepository.save(inv);
            reservation.setStatus("COMMITTED");
            reservationRepository.save(reservation);
        }
    }

    @Transactional
    public void release(String orderRef) {
        var reservations = reservationRepository.findByOrderRefAndStatus(orderRef, "RESERVED");
        for (StockReservation reservation : reservations) {
            InventoryItem inv = inventoryRepository.lockBySku(reservation.getSku())
                    .orElseThrow(() -> new DomainException("INV_NOT_FOUND", "No inventory for SKU " + reservation.getSku()));
            inv.setReservedQty(inv.getReservedQty() - reservation.getQuantity());
            inventoryRepository.save(inv);
            reservation.setStatus("RELEASED");
            reservationRepository.save(reservation);
        }
    }

    @Transactional
    public int releaseExpired() {
        int released = 0;
        var expired = reservationRepository.findByStatusAndExpiresAtBefore("RESERVED", Instant.now());
        for (StockReservation reservation : expired) {
            InventoryItem inv = inventoryRepository.lockBySku(reservation.getSku()).orElse(null);
            if (inv != null) {
                inv.setReservedQty(Math.max(0, inv.getReservedQty() - reservation.getQuantity()));
                inventoryRepository.save(inv);
            }
            reservation.setStatus("EXPIRED");
            reservationRepository.save(reservation);
            released++;
        }
        return released;
    }

    @Transactional
    public void reserveForCart(CartReservationRequest request) {
        InventoryItem inv = inventoryRepository.lockBySku(request.sku())
                .orElseThrow(() -> new DomainException("INV_NOT_FOUND", "No inventory for SKU " + request.sku()));
        if (inv.getAvailableQty() < request.quantity()) {
            throw new DomainException("INSUFFICIENT_STOCK", "Not enough stock for " + request.sku());
        }
        inv.setReservedQty(inv.getReservedQty() + request.quantity());
        inventoryRepository.save(inv);

        String cartRef = cartRef(request.userEmail());
        StockReservation reservation = reservationRepository
                .findByOrderRefAndSkuAndStatus(cartRef, request.sku(), "CART_RESERVED")
                .orElseGet(() -> {
                    StockReservation r = new StockReservation();
                    r.setOrderRef(cartRef);
                    r.setSku(request.sku());
                    r.setQuantity(0);
                    r.setStatus("CART_RESERVED");
                    r.setExpiresAt(Instant.now().plusSeconds(24 * 60 * 60L));
                    return r;
                });
        reservation.setQuantity(reservation.getQuantity() + request.quantity());
        reservation.setExpiresAt(Instant.now().plusSeconds(24 * 60 * 60L));
        reservationRepository.save(reservation);
    }

    @Transactional
    public void releaseForCart(CartReservationRequest request) {
        InventoryItem inv = inventoryRepository.lockBySku(request.sku())
                .orElseThrow(() -> new DomainException("INV_NOT_FOUND", "No inventory for SKU " + request.sku()));

        String cartRef = cartRef(request.userEmail());
        StockReservation reservation = reservationRepository
                .findByOrderRefAndSkuAndStatus(cartRef, request.sku(), "CART_RESERVED")
                .orElse(null);
        if (reservation == null) {
            return;
        }

        int releaseQty = Math.min(request.quantity(), reservation.getQuantity());
        if (releaseQty <= 0) {
            return;
        }

        inv.setReservedQty(Math.max(0, inv.getReservedQty() - releaseQty));
        inventoryRepository.save(inv);

        reservation.setQuantity(reservation.getQuantity() - releaseQty);
        if (reservation.getQuantity() <= 0) {
            reservation.setStatus("CART_RELEASED");
        }
        reservationRepository.save(reservation);
    }

    @Transactional(readOnly = true)
    public Map<String, Integer> availability(List<String> skus) {
        Map<String, Integer> result = new HashMap<>();
        for (String sku : skus) {
            int available = inventoryRepository.findBySku(sku).map(InventoryItem::getAvailableQty).orElse(0);
            result.put(sku, Math.max(0, available));
        }
        return result;
    }

    private String cartRef(String userEmail) {
        return "CART:" + userEmail;
    }

    @Transactional
    public InventoryItem adjustInventory(InventoryAdjustmentRequest request) {
        InventoryItem inv = inventoryRepository.lockBySku(request.sku())
                .orElseThrow(() -> new DomainException("INV_NOT_FOUND", "No inventory for SKU " + request.sku()));

        int newQty = inv.getTotalQty() + request.quantityDelta();
        if (newQty < inv.getReservedQty()) {
            throw new DomainException("INVALID_ADJUSTMENT", "Total quantity cannot go below reserved quantity");
        }
        inv.setTotalQty(newQty);
        if (request.reorderThreshold() != null && request.reorderThreshold() >= 0) {
            inv.setReorderThreshold(request.reorderThreshold());
        }
        return inventoryRepository.save(inv);
    }

    @Transactional
    public InventoryItem upsertInventory(InventoryUpsertRequest request) {
        InventoryItem inv = inventoryRepository.lockBySku(request.sku()).orElse(null);
        if (inv == null) {
            inv = new InventoryItem();
            inv.setSku(request.sku());
            inv.setProductName(request.productName());
            inv.setTotalQty(0);
            inv.setReservedQty(0);
        } else {
            inv.setProductName(request.productName());
        }

        int newQty = inv.getTotalQty() + request.quantityDelta();
        if (newQty < inv.getReservedQty()) {
            throw new DomainException("INVALID_ADJUSTMENT", "Total quantity cannot go below reserved quantity");
        }
        inv.setTotalQty(newQty);

        if (request.reorderThreshold() != null && request.reorderThreshold() >= 0) {
            inv.setReorderThreshold(request.reorderThreshold());
        }

        return inventoryRepository.save(inv);
    }

    @Transactional(readOnly = true)
    public List<LowStockItemResponse> lowStock() {
        return inventoryRepository.findAll().stream()
                .filter(i -> i.getAvailableQty() <= i.getReorderThreshold())
                .map(i -> new LowStockItemResponse(i.getSku(), i.getProductName(), i.getAvailableQty(), i.getReorderThreshold()))
                .toList();
    }
}
