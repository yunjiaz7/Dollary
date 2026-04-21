package com.billingbook.controller;

import com.billingbook.dto.TransactionCreateRequest;
import com.billingbook.dto.TransactionResponse;
import com.billingbook.dto.TransactionUpdateRequest;
import com.billingbook.service.CsvImportService;
import com.billingbook.service.TransactionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    private final CsvImportService csvImportService;
    private final TransactionService transactionService;

    public TransactionController(CsvImportService csvImportService, TransactionService transactionService) {
        this.csvImportService = csvImportService;
        this.transactionService = transactionService;
    }

    @GetMapping
    public List<TransactionResponse> listTransactions(
            @RequestParam int year,
            @RequestParam int month) {
        return transactionService.getTransactions(year, month);
    }

    @PostMapping
    public TransactionResponse createTransaction(@RequestBody TransactionCreateRequest req) {
        return transactionService.createTransaction(req);
    }

    @PutMapping("/{id}")
    public TransactionResponse updateTransaction(@PathVariable UUID id, @RequestBody TransactionUpdateRequest req) {
        return transactionService.updateTransaction(id, req);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTransaction(@PathVariable UUID id) {
        transactionService.deleteTransaction(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/import")
    public ResponseEntity<?> importCsv(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "文件不能为空"));
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || !originalFilename.toLowerCase().endsWith(".csv")) {
            return ResponseEntity.badRequest().body(Map.of("error", "仅支持 CSV 文件"));
        }

        try {
            Map<String, Integer> result = csvImportService.importCsv(file);
            return ResponseEntity.ok(result);
        } catch (IllegalStateException e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "系统分类数据异常"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "CSV 解析失败，请检查文件格式"));
        }
    }
}
