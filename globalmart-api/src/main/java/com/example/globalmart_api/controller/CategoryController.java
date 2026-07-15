package com.example.globalmart_api.controller;

import com.example.globalmart_api.dto.CategoryRequest;
import com.example.globalmart_api.model.Category;
import com.example.globalmart_api.model.Product;
import com.example.globalmart_api.repository.CategoryRepository;
import com.example.globalmart_api.repository.ProductRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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
    public List<Map<String, Object>> getAllCategories() {
        return categoryRepository.findAll().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getCategoryById(@PathVariable Long id) {
        return categoryRepository.findById(id)
                .map(category -> ResponseEntity.ok(convertToResponse(category)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/products")
    public List<Map<String, Object>> getProductsByCategoryId(
            @PathVariable Long id,
            @RequestParam(required = false) String search
    ) {
        List<Product> products;
        if (search != null && !search.trim().isEmpty()) {
            products = productRepository.searchProductsByCategory(id, search.trim());
        } else {
            products = productRepository.findByCategoryId(id);
        }
        return products.stream()
                .map(product -> Map.<String, Object>of(
                        "id", product.getId(),
                        "name", product.getName(),
                        "description", product.getDescription() != null ? product.getDescription() : "",
                        "price", product.getPrice(),
                        "image", product.getImage() != null ? product.getImage() : "",
                        "categoryId", product.getCategoryId() != null ? product.getCategoryId() : 0
                ))
                .collect(Collectors.toList());
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createCategory(@Valid @RequestBody CategoryRequest request) {
        Category category = new Category();
        applyRequest(category, request);
        Category savedCategory = categoryRepository.save(category);
        return ResponseEntity.ok(convertToResponse(savedCategory));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateCategory(
            @PathVariable Long id,
            @Valid @RequestBody CategoryRequest request
    ) {
        return categoryRepository.findById(id)
                .map(category -> {
                    applyRequest(category, request);
                    Category updatedCategory = categoryRepository.save(category);
                    return ResponseEntity.ok(convertToResponse(updatedCategory));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
        if (!categoryRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        List<Product> products = productRepository.findByCategoryId(id);
        if (!products.isEmpty()) {
            productRepository.deleteAll(products);
        }

        categoryRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private void applyRequest(Category category, CategoryRequest request) {
        category.setName(request.getName());
        category.setDescription(request.getDescription());
    }

    private Map<String, Object> convertToResponse(Category category) {
        return Map.of(
                "id", category.getId(),
                "name", category.getName(),
                "description", category.getDescription() != null ? category.getDescription() : "",
                "productCount", productRepository.findByCategoryId(category.getId()).size()
        );
    }
}
