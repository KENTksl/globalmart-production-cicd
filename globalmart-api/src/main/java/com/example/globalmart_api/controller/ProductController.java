package com.example.globalmart_api.controller;

import com.example.globalmart_api.model.Category;
import com.example.globalmart_api.model.Product;
import com.example.globalmart_api.repository.CategoryRepository;
import com.example.globalmart_api.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/products")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class ProductController {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllProducts() {
        List<Product> products = productRepository.findAll();
        List<Map<String, Object>> response = products.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getProductById(@PathVariable long id) {
        return productRepository.findByNumericId(id)
                .map(product -> ResponseEntity.ok(convertToResponse(product)))
                .orElse(ResponseEntity.notFound().build());
    }

    private Map<String, Object> convertToResponse(Product product) {
        long categoryNumericId = 0;
        if (product.getCategoryId() != null) {
            Category category = categoryRepository.findById(product.getCategoryId()).orElse(null);
            if (category != null) {
                categoryNumericId = category.getNumericId();
            }
        }
        return Map.of(
                "id", product.getNumericId(),
                "name", product.getName(),
                "description", product.getDescription(),
                "price", product.getPrice(),
                "image", product.getImage() != null ? product.getImage() : "",
                "categoryId", categoryNumericId
        );
    }
}
