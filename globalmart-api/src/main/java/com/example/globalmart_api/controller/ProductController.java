package com.example.globalmart_api.controller;

import com.example.globalmart_api.dto.ProductRequest;
import com.example.globalmart_api.model.Category;
import com.example.globalmart_api.model.Product;
import com.example.globalmart_api.repository.CategoryRepository;
import com.example.globalmart_api.repository.ProductRepository;
import jakarta.validation.Valid;
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
    public ResponseEntity<Map<String, Object>> getProductById(@PathVariable Long id) {
        return productRepository.findById(id)
                .map(product -> ResponseEntity.ok(convertToResponse(product)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createProduct(@Valid @RequestBody ProductRequest request) {
        if (!categoryRepository.existsById(request.getCategoryId())) {
            return ResponseEntity.badRequest().build();
        }

        Product product = new Product();
        applyRequest(product, request);
        Product savedProduct = productRepository.save(product);
        return ResponseEntity.ok(convertToResponse(savedProduct));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody ProductRequest request
    ) {
        if (!categoryRepository.existsById(request.getCategoryId())) {
            return ResponseEntity.badRequest().build();
        }

        return productRepository.findById(id)
                .map(product -> {
                    applyRequest(product, request);
                    Product updatedProduct = productRepository.save(product);
                    return ResponseEntity.ok(convertToResponse(updatedProduct));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        if (!productRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        productRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private void applyRequest(Product product, ProductRequest request) {
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setImage(request.getImage());
        product.setCategoryId(request.getCategoryId());
    }

    private Map<String, Object> convertToResponse(Product product) {
        Long categoryId = product.getCategoryId();
        String categoryName = categoryId == null
                ? ""
                : categoryRepository.findById(categoryId).map(Category::getName).orElse("");
        return Map.of(
                "id", product.getId(),
                "name", product.getName(),
                "description", product.getDescription(),
                "price", product.getPrice(),
                "image", product.getImage() != null ? product.getImage() : "",
                "categoryId", categoryId != null ? categoryId : 0,
                "categoryName", categoryName
        );
    }
}
