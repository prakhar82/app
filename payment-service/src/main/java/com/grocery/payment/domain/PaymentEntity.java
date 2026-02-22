package com.grocery.payment.domain;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "payments")
public class PaymentEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private String orderRef;
    @Column(nullable = false)
    private String method;
    @Column(nullable = false)
    private BigDecimal amount;
    @Column(nullable = false)
    private String status;
    @Column(nullable = false)
    private Instant createdAt;

    @PrePersist void pre(){ createdAt = Instant.now(); }

    public void setOrderRef(String orderRef){this.orderRef=orderRef;} public void setMethod(String method){this.method=method;}
    public void setAmount(BigDecimal amount){this.amount=amount;} public void setStatus(String status){this.status=status;}
    public String getOrderRef(){return orderRef;} public String getStatus(){return status;}
}
