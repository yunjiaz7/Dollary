package com.billingbook.dto;

import java.math.BigDecimal;

public record CategorySummaryResponse(
        String categoryName,
        BigDecimal totalAmount
) {}
