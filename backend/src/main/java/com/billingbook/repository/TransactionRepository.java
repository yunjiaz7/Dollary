package com.billingbook.repository;

import com.billingbook.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface TransactionRepository extends JpaRepository<Transaction, UUID> {

    boolean existsBySourceHash(String sourceHash);
}
