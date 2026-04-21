package com.billingbook.dto;

import com.billingbook.model.Transaction;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record TransactionResponse(
        UUID id,
        BigDecimal amount,
        LocalDate date,
        String merchantName,
        String categoryName,
        UUID categoryId,
        String note,
        boolean isIncome,
        boolean isManual
) {
    public static TransactionResponse from(Transaction tx) {
        return new TransactionResponse(
                tx.getId(),
                tx.getAmount(),
                tx.getDate(),
                tx.getMerchantName(),
                tx.getCategory().getName(),
                tx.getCategory().getId(),
                tx.getNote(),
                tx.isIncome(),
                tx.isManual()
        );
    }
}
