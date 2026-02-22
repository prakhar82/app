package com.grocery.cart.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "cart_items", uniqueConstraints = @UniqueConstraint(name = "uk_cart_user_sku", columnNames = {"user_email", "sku"}))
public class CartItem {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "user_email", nullable = false)
    private String userEmail;
    @Column(nullable = false)
    private String sku;
    @Column(name = "item_name", nullable = false)
    private String itemName;
    @Column(nullable = false)
    private int quantity;
    public Long getId(){return id;}
    public String getUserEmail(){return userEmail;} public void setUserEmail(String userEmail){this.userEmail=userEmail;}
    public String getSku(){return sku;} public void setSku(String sku){this.sku=sku;}
    public String getItemName(){return itemName;} public void setItemName(String itemName){this.itemName=itemName;}
    public int getQuantity(){return quantity;} public void setQuantity(int quantity){this.quantity=quantity;}
}
