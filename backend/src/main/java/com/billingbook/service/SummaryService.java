package com.billingbook.service;

import com.billingbook.dto.CategorySummaryResponse;
import com.billingbook.dto.SummaryResponse;
import com.billingbook.repository.TransactionRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

@Service
public class SummaryService {

    private final TransactionRepository transactionRepository;

    public SummaryService(TransactionRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

    public SummaryResponse getSummary(int year, int month) {
        YearMonth ym = YearMonth.of(year, month);
        LocalDate start = ym.atDay(1);
        LocalDate end = ym.atEndOfMonth();

        BigDecimal income = transactionRepository.sumIncomeByDateBetween(start, end);
        BigDecimal expense = transactionRepository.sumExpenseByDateBetween(start, end);

        return new SummaryResponse(income, expense, income.subtract(expense));
    }

    public List<CategorySummaryResponse> getCategorySummary(int year, int month) {
        YearMonth ym = YearMonth.of(year, month);
        LocalDate start = ym.atDay(1);
        LocalDate end = ym.atEndOfMonth();

        return transactionRepository.sumExpenseByCategoryBetween(start, end)
                .stream()
                .map(row -> new CategorySummaryResponse((String) row[0], (BigDecimal) row[1]))
                .toList();
    }
}
