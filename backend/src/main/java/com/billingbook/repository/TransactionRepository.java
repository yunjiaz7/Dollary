package com.billingbook.repository;

import com.billingbook.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface TransactionRepository extends JpaRepository<Transaction, UUID> {

    boolean existsBySourceHash(String sourceHash);

    List<Transaction> findByDateBetweenOrderByDateDesc(LocalDate start, LocalDate end);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.date BETWEEN :start AND :end AND t.income = true")
    BigDecimal sumIncomeByDateBetween(@Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.date BETWEEN :start AND :end AND t.income = false")
    BigDecimal sumExpenseByDateBetween(@Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("SELECT t.category.name AS categoryName, SUM(t.amount) AS totalAmount " +
           "FROM Transaction t WHERE t.date BETWEEN :start AND :end AND t.income = false " +
           "GROUP BY t.category.name ORDER BY totalAmount DESC")
    List<Object[]> sumExpenseByCategoryBetween(@Param("start") LocalDate start, @Param("end") LocalDate end);
}
