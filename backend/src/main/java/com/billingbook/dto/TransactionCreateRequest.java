package com.billingbook.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record TransactionCreateRequest(
        BigDecimal amount,
        LocalDate date,
        UUID categoryId,
        String note,
        boolean isIncome
) {}
