package com.billingbook.service;

import com.billingbook.model.Category;
import com.billingbook.model.Transaction;
import com.billingbook.repository.CategoryRepository;
import com.billingbook.repository.TransactionRepository;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class CsvImportService {

    private final TransactionRepository transactionRepository;
    private final CategoryRepository categoryRepository;

    private Map<String, String> categoryKeywordMap;

    public CsvImportService(TransactionRepository transactionRepository, CategoryRepository categoryRepository) {
        this.transactionRepository = transactionRepository;
        this.categoryRepository = categoryRepository;
    }

    public Map<String, Integer> importCsv(MultipartFile file) throws Exception {
        int imported = 0;
        int skippedDuplicate = 0;
        int skippedPending = 0;

        loadKeywordMap();

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8));
             CSVParser csvParser = CSVFormat.DEFAULT
                     .builder()
                     .setHeader()
                     .setSkipHeaderRecord(true)
                     .setTrim(true)
                     .build()
                     .parse(reader)) {

            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MM/dd/yyyy");

            for (CSVRecord record : csvParser) {
                String postedDate = record.get("Posted Date");
                String referenceNumber = record.get("Reference Number");
                String payee = record.get("Payee");
                String amountStr = record.get("Amount");

                if (postedDate == null || postedDate.isBlank()) {
                    skippedPending++;
                    continue;
                }

                if (referenceNumber != null && !referenceNumber.isBlank()
                        && transactionRepository.existsBySourceHash(referenceNumber)) {
                    skippedDuplicate++;
                    continue;
                }

                Transaction tx = new Transaction();
                tx.setDate(LocalDate.parse(postedDate.trim(), formatter));
                tx.setMerchantName(payee != null ? payee.trim() : "");
                tx.setManual(false);
                tx.setCategoryModifiedByUser(false);
                tx.setNote(null);

                BigDecimal amount = new BigDecimal(amountStr.trim());
                if (amount.compareTo(BigDecimal.ZERO) > 0) {
                    tx.setIncome(true);
                    tx.setAmount(amount);
                } else {
                    tx.setIncome(false);
                    tx.setAmount(amount.abs());
                }

                tx.setSourceHash(referenceNumber != null && !referenceNumber.isBlank() ? referenceNumber.trim() : null);
                tx.setCategory(categorize(payee));

                transactionRepository.save(tx);
                imported++;
            }
        }

        Map<String, Integer> result = new LinkedHashMap<>();
        result.put("imported", imported);
        result.put("skippedDuplicate", skippedDuplicate);
        result.put("skippedPending", skippedPending);
        return result;
    }

    private void loadKeywordMap() {
        categoryKeywordMap = new LinkedHashMap<>();
        categoryKeywordMap.put("交通", "UBER,LYFT,CLIPPER,BART");
        categoryKeywordMap.put("餐饮", "STARBUCKS,SAFEWAY,WHOLEFDS,TRADER JOE,TACO BELL,CHIPOTLE,MCDONALD");
        categoryKeywordMap.put("购物", "AMAZON,AMAZON MKTPL,WALMART,TARGET");
        categoryKeywordMap.put("娱乐", "NETFLIX,SPOTIFY,OPENAI,CLAUDE,APPLE,GOOGLE");
        categoryKeywordMap.put("医疗", "HEADWAY,TALKIATRY");
        categoryKeywordMap.put("旅行", "DELTA,AMERICAN AIR,UNITED,SOUTHWEST");
        categoryKeywordMap.put("账单/水电", "PG&E,COMCAST,ATT,VERIZON");
        categoryKeywordMap.put("收入", "PAYROLL,DIRECT DEP,ZELLE,VENMO,TRANSFER FROM");
    }

    private Category categorize(String payee) {
        if (payee == null || payee.isBlank()) {
            return getCategoryByName("其他");
        }

        String upperPayee = payee.toUpperCase();

        for (Map.Entry<String, String> entry : categoryKeywordMap.entrySet()) {
            String[] keywords = entry.getValue().split(",");
            for (String keyword : keywords) {
                if (upperPayee.contains(keyword.trim())) {
                    return getCategoryByName(entry.getKey());
                }
            }
        }

        return getCategoryByName("其他");
    }

    private Category getCategoryByName(String name) {
        return categoryRepository.findByName(name)
                .orElseThrow(() -> new IllegalStateException("System category not found: " + name));
    }
}
