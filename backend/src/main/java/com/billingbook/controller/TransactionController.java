package com.billingbook.controller;

import com.billingbook.service.CsvImportService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    private final CsvImportService csvImportService;

    public TransactionController(CsvImportService csvImportService) {
        this.csvImportService = csvImportService;
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
