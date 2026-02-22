package com.grocery.order.domain;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
public class OrderEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true)
    private String orderRef;
    @Column(nullable = false)
    private String userEmail;
    @Column(nullable = false)
    private String paymentMethod;
    @Column(nullable = false)
    private String status;
    @Column(length = 500)
    private String rejectionComment;
    @Column(nullable = false)
    private BigDecimal totalAmount;
    @Column(nullable = false)
    private Instant createdAt;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItemEntity> items = new ArrayList<>();

    @PrePersist void pre(){ createdAt = Instant.now(); }

    public Long getId(){return id;} public String getOrderRef(){return orderRef;} public void setOrderRef(String o){this.orderRef=o;}
    public String getUserEmail(){return userEmail;} public void setUserEmail(String u){this.userEmail=u;}
    public String getPaymentMethod(){return paymentMethod;} public void setPaymentMethod(String p){this.paymentMethod=p;}
    public String getStatus(){return status;} public void setStatus(String s){this.status=s;}
    public String getRejectionComment(){return rejectionComment;} public void setRejectionComment(String rejectionComment){this.rejectionComment=rejectionComment;}
    public BigDecimal getTotalAmount(){return totalAmount;} public void setTotalAmount(BigDecimal t){this.totalAmount=t;}
    public Instant getCreatedAt(){return createdAt;}
    public List<OrderItemEntity> getItems(){return items;}
}
