package com.grocery.catalog.domain;

import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(name = "products", indexes = {
        @Index(name = "idx_products_sku", columnList = "sku", unique = true),
        @Index(name = "idx_products_name", columnList = "name")
})
public class Product {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "subcategory_id")
    private Subcategory subcategory;
    @Column(nullable = false)
    private String name;
    @Column(nullable = false, unique = true)
    private String sku;
    @Column(nullable = false)
    private BigDecimal price;
    @Column(nullable = false)
    private BigDecimal taxPercent;
    @Column(nullable = false)
    private String unit;
    private BigDecimal discountPercent;
    private String imageUrl;
    @Column(columnDefinition = "TEXT")
    private String description;

    public Long getId(){return id;} public Category getCategory(){return category;} public void setCategory(Category c){this.category=c;}
    public Subcategory getSubcategory(){return subcategory;} public void setSubcategory(Subcategory s){this.subcategory=s;}
    public String getName(){return name;} public void setName(String n){this.name=n;}
    public String getSku(){return sku;} public void setSku(String s){this.sku=s;} public BigDecimal getPrice(){return price;} public void setPrice(BigDecimal p){this.price=p;}
    public BigDecimal getTaxPercent(){return taxPercent;} public void setTaxPercent(BigDecimal t){this.taxPercent=t;} public String getUnit(){return unit;} public void setUnit(String u){this.unit=u;}
    public BigDecimal getDiscountPercent(){return discountPercent;} public void setDiscountPercent(BigDecimal d){this.discountPercent=d;} public String getImageUrl(){return imageUrl;} public void setImageUrl(String i){this.imageUrl=i;}
    public String getDescription(){return description;} public void setDescription(String d){this.description=d;}
}
