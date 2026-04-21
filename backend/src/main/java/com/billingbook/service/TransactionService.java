package com.billingbook.service;

import com.billingbook.dto.TransactionCreateRequest;
import com.billingbook.dto.TransactionResponse;
import com.billingbook.dto.TransactionUpdateRequest;
import com.billingbook.model.Category;
import com.billingbook.model.Transaction;
import com.billingbook.repository.CategoryRepository;
import com.billingbook.repository.TransactionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.UUID;

@Service
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final CategoryRepository categoryRepository;

    public TransactionService(TransactionRepository transactionRepository, CategoryRepository categoryRepository) {
        this.transactionRepository = transactionRepository;
        this.categoryRepository = categoryRepository;
    }

    public List<TransactionResponse> getTransactions(int year, int month) {
        YearMonth ym = YearMonth.of(year, month);
        LocalDate start = ym.atDay(1);
        LocalDate end = ym.atEndOfMonth();
        return transactionRepository.findByDateBetweenOrderByDateDesc(start, end)
                .stream().map(TransactionResponse::from).toList();
    }

    public TransactionResponse createTransaction(TransactionCreateRequest req) {
        if (req.amount() == null || req.amount().signum() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "金额必须为正数");
        }
        if (req.date() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "日期不能为空");
        }

        Category category = categoryRepository.findById(req.categoryId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "分类不存在"));

        Transaction tx = new Transaction();
        tx.setAmount(req.amount());
        tx.setDate(req.date());
        tx.setMerchantName("手动添加");
        tx.setCategory(category);
        tx.setNote(req.note());
        tx.setIncome(req.isIncome());
        tx.setManual(true);
        tx.setCategoryModifiedByUser(false);
        tx.setSourceHash(null);
        return TransactionResponse.from(transactionRepository.save(tx));
    }

    public TransactionResponse updateTransaction(UUID id, TransactionUpdateRequest req) {
        Transaction tx = transactionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "交易记录不存在"));

        if (req.amount() != null) {
            if (req.amount().signum() <= 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "金额必须为正数");
            }
            tx.setAmount(req.amount());
        }

        if (req.categoryId() != null) {
            Category category = categoryRepository.findById(req.categoryId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "分类不存在"));
            tx.setCategory(category);
            tx.setCategoryModifiedByUser(true);
        }

        if (req.note() != null) {
            tx.setNote(req.note());
        }

        if (req.isIncome() != null) {
            tx.setIncome(req.isIncome());
        }

        return TransactionResponse.from(transactionRepository.save(tx));
    }

    public void deleteTransaction(UUID id) {
        Transaction tx = transactionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "交易记录不存在"));

        if (!tx.isManual()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "CSV导入的记录不可删除");
        }

        transactionRepository.delete(tx);
    }
}
