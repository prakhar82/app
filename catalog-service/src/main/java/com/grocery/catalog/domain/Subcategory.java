package com.grocery.catalog.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "subcategories", indexes = @Index(name = "idx_subcat_name_cat", columnList = "name,category_id", unique = true))
public class Subcategory {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;
    @Column(nullable = false)
    private String name;
    public Long getId(){return id;} public Category getCategory(){return category;} public void setCategory(Category c){this.category=c;} public String getName(){return name;} public void setName(String n){this.name=n;}
}
