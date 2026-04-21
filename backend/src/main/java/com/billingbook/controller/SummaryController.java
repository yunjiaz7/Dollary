package com.billingbook.controller;

import com.billingbook.dto.CategorySummaryResponse;
import com.billingbook.dto.SummaryResponse;
import com.billingbook.service.SummaryService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/summary")
public class SummaryController {

    private final SummaryService summaryService;

    public SummaryController(SummaryService summaryService) {
        this.summaryService = summaryService;
    }

    @GetMapping
    public SummaryResponse getSummary(@RequestParam int year, @RequestParam int month) {
        return summaryService.getSummary(year, month);
    }

    @GetMapping("/categories")
    public List<CategorySummaryResponse> getCategorySummary(@RequestParam int year, @RequestParam int month) {
        return summaryService.getCategorySummary(year, month);
    }
}
