package com.grocery.order.domain;

import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(name = "order_items")
public class OrderItemEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(optional = false)
    @JoinColumn(name = "order_id")
    private OrderEntity order;
    @Column(nullable = false)
    private String sku;
    @Column(nullable = false)
    private String itemName;
    @Column(nullable = false)
    private int quantity;
    @Column(nullable = false)
    private BigDecimal unitPrice;

    public void setOrder(OrderEntity order){this.order=order;} public String getSku(){return sku;} public void setSku(String sku){this.sku=sku;}
    public String getItemName(){return itemName;} public void setItemName(String itemName){this.itemName=itemName;}
    public int getQuantity(){return quantity;} public void setQuantity(int quantity){this.quantity=quantity;}
    public BigDecimal getUnitPrice(){return unitPrice;} public void setUnitPrice(BigDecimal unitPrice){this.unitPrice=unitPrice;}
}
