package com.grocery.catalog.repo;

import com.grocery.catalog.domain.Category;
import com.grocery.catalog.domain.Subcategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SubcategoryRepository extends JpaRepository<Subcategory, Long> {
    Optional<Subcategory> findByNameIgnoreCaseAndCategory(String name, Category category);
}
