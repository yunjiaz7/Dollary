package com.billingbook.config;

import com.billingbook.model.Category;
import com.billingbook.repository.CategoryRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DataInitializer implements ApplicationRunner {

    private final CategoryRepository categoryRepository;

    public DataInitializer(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    private static final List<String> SYSTEM_CATEGORIES = List.of(
            "餐饮", "购物", "交通", "娱乐", "账单/水电", "医疗", "旅行", "收入", "其他"
    );

    @Override
    public void run(ApplicationArguments args) {
        if (!categoryRepository.existsBySystemTrue()) {
            for (String name : SYSTEM_CATEGORIES) {
                categoryRepository.save(new Category(name, true));
            }
        }
    }
}
