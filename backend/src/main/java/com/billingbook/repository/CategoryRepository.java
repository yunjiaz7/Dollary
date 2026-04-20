package com.billingbook.repository;

import com.billingbook.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface CategoryRepository extends JpaRepository<Category, UUID> {

    boolean existsBySystemTrue();

    boolean existsByName(String name);

    Optional<Category> findByName(String name);
}
