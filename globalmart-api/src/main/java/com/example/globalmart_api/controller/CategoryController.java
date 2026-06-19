package com.example.globalmart_api.controller;

import com.example.globalmart_api.model.Category;
import com.example.globalmart_api.repository.CategoryRepository;
import com.example.globalmart_api.repository.ProductRepository;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/categories")
@CrossOrigin(origins = "http://localhost:5173")
public class CategoryController {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    public CategoryController(CategoryRepository categoryRepository, ProductRepository productRepository) {
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
    }

    @GetMapping
    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    @GetMapping("/{id}")
    public Category getCategoryById(@PathVariable Long id) {
        return categoryRepository.findById(id).orElse(null);
    }

    @GetMapping("/{id}/products")
    public List<com.example.globalmart_api.model.Product> getProductsByCategoryId(@PathVariable Long id) {
        return productRepository.findByCategoryId(id);
    }
}
