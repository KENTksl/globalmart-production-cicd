package com.example.globalmart_api.controller;

import com.example.globalmart_api.model.Category;
import com.example.globalmart_api.model.Order;
import com.example.globalmart_api.model.Product;
import com.example.globalmart_api.repository.CategoryRepository;
import com.example.globalmart_api.repository.OrderRepository;
import com.example.globalmart_api.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class AdminController {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final OrderRepository orderRepository;

    @GetMapping("/stats")
    public Map<String, Object> getStats() {
        List<Product> products = productRepository.findAll();
        List<Category> categories = categoryRepository.findAll();
        List<Order> orders = orderRepository.findAll();

        double totalRevenue = orders.stream()
                .mapToDouble(Order::getTotalAmount)
                .sum();

        List<Map<String, Object>> productsPerCategory = categories.stream()
                .map(category -> Map.<String, Object>of(
                        "label", category.getName(),
                        "value", products.stream().filter(product -> category.getId().equals(product.getCategoryId())).count()
                ))
                .collect(Collectors.toList());

        List<Map<String, Object>> orderStatusBreakdown = orders.stream()
                .collect(Collectors.groupingBy(Order::getStatus, Collectors.counting()))
                .entrySet()
                .stream()
                .map(entry -> Map.<String, Object>of(
                        "label", entry.getKey(),
                        "value", entry.getValue()
                ))
                .collect(Collectors.toList());

        List<Map<String, Object>> latestOrders = orders.stream()
                .sorted(Comparator.comparing(Order::getCreatedAt).reversed())
                .limit(5)
                .map(order -> Map.<String, Object>of(
                        "id", order.getId(),
                        "customerName", order.getCustomerName(),
                        "totalAmount", order.getTotalAmount(),
                        "status", order.getStatus(),
                        "createdAt", order.getCreatedAt()
                ))
                .collect(Collectors.toList());

        return Map.of(
                "totalProducts", products.size(),
                "totalCategories", categories.size(),
                "totalOrders", orders.size(),
                "totalRevenue", totalRevenue,
                "productsPerCategory", productsPerCategory,
                "orderStatusBreakdown", orderStatusBreakdown,
                "latestOrders", latestOrders
        );
    }
}
