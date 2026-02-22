package com.grocery.order.domain;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "order_delivery_address", indexes = {
        @Index(name = "idx_order_delivery_order_id", columnList = "order_id", unique = true)
})
public class OrderDeliveryAddressEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id", nullable = false, unique = true)
    private Long orderId;
    @Column
    private String recipientName;
    @Column(nullable = false)
    private String line1;
    @Column
    private String line2;
    @Column(nullable = false)
    private String city;
    @Column(nullable = false)
    private String postcode;
    @Column(nullable = false)
    private String country;
    @Column(nullable = false)
    private Instant snapshotAt;

    @PrePersist
    void prePersist() {
        this.snapshotAt = Instant.now();
    }

    public Long getId() { return id; }
    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }
    public String getRecipientName() { return recipientName; }
    public void setRecipientName(String recipientName) { this.recipientName = recipientName; }
    public String getLine1() { return line1; }
    public void setLine1(String line1) { this.line1 = line1; }
    public String getLine2() { return line2; }
    public void setLine2(String line2) { this.line2 = line2; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getPostcode() { return postcode; }
    public void setPostcode(String postcode) { this.postcode = postcode; }
    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }
}
