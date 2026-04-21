package com.billingbook.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record TransactionUpdateRequest(
        BigDecimal amount,
        UUID categoryId,
        String note,
        Boolean isIncome
) {}
