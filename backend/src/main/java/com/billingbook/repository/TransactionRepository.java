package com.billingbook.repository;

import com.billingbook.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface TransactionRepository extends JpaRepository<Transaction, UUID> {

    boolean existsBySourceHash(String sourceHash);

    List<Transaction> findByDateBetweenOrderByDateDesc(LocalDate start, LocalDate end);
}
