package com.grocery.inventory.domain;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "stock_reservations", indexes = @Index(name = "idx_reservation_order", columnList = "orderRef"))
public class StockReservation {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private String orderRef;
    @Column(nullable = false)
    private String sku;
    @Column(nullable = false)
    private int quantity;
    @Column(nullable = false)
    private Instant expiresAt;
    @Column(nullable = false)
    private String status;

    public Long getId(){return id;} public String getOrderRef(){return orderRef;} public void setOrderRef(String orderRef){this.orderRef=orderRef;}
    public String getSku(){return sku;} public void setSku(String sku){this.sku=sku;} public int getQuantity(){return quantity;} public void setQuantity(int quantity){this.quantity=quantity;}
    public Instant getExpiresAt(){return expiresAt;} public void setExpiresAt(Instant expiresAt){this.expiresAt=expiresAt;} public String getStatus(){return status;} public void setStatus(String status){this.status=status;}
}
