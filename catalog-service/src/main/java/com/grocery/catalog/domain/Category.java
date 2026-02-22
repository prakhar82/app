package com.grocery.catalog.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "categories", indexes = @Index(name = "idx_categories_name", columnList = "name", unique = true))
public class Category {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true)
    private String name;
    public Long getId(){return id;} public String getName(){return name;} public void setName(String n){this.name=n;}
}
