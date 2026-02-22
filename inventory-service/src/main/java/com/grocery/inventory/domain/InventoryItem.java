package com.grocery.inventory.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "inventory", indexes = @Index(name = "idx_inventory_sku", columnList = "sku", unique = true))
public class InventoryItem {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true)
    private String sku;
    @Column(nullable = false)
    private String productName;
    @Column(nullable = false)
    private int totalQty;
    @Column(nullable = false)
    private int reservedQty;
    @Column(nullable = false)
    private int reorderThreshold = 20;

    public Long getId(){return id;} public String getSku(){return sku;} public void setSku(String sku){this.sku=sku;}
    public String getProductName(){return productName;} public void setProductName(String productName){this.productName=productName;}
    public int getTotalQty(){return totalQty;} public void setTotalQty(int totalQty){this.totalQty=totalQty;}
    public int getReservedQty(){return reservedQty;} public void setReservedQty(int reservedQty){this.reservedQty=reservedQty;}
    public int getReorderThreshold(){return reorderThreshold;} public void setReorderThreshold(int reorderThreshold){this.reorderThreshold=reorderThreshold;}
    public int getAvailableQty(){return totalQty-reservedQty;}
}
