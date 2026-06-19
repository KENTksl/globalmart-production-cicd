package com.example.globalmart_api.controller;

import com.example.globalmart_api.dto.CheckoutRequest;
import com.example.globalmart_api.model.Order;
import com.example.globalmart_api.model.Product;
import com.example.globalmart_api.repository.OrderRepository;
import com.example.globalmart_api.repository.ProductRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class OrderController {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;

    @PostMapping("/checkout")
    public ResponseEntity<Map<String, Object>> checkout(@Valid @RequestBody CheckoutRequest request) {
        List<Order.OrderItem> orderItems = new ArrayList<>();
        double totalAmount = 0;

        for (CheckoutRequest.CheckoutItemRequest itemRequest : request.getItems()) {
            Product product = productRepository.findById(itemRequest.getProductId()).orElse(null);
            if (product == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "San pham khong ton tai"));
            }

            int quantity = itemRequest.getQuantity();
            double lineTotal = product.getPrice() * quantity;
            totalAmount += lineTotal;
            orderItems.add(new Order.OrderItem(product.getId(), quantity, product.getPrice()));
        }

        Order order = new Order();
        order.setUserId(request.getUserId() != null ? request.getUserId() : 0L);
        order.setCustomerName(request.getCustomerName());
        order.setEmail(request.getEmail());
        order.setPhone(request.getPhone());
        order.setAddress(request.getAddress());
        order.setNotes(request.getNotes());
        order.setItems(orderItems);
        order.setTotalAmount(totalAmount);
        order.setStatus("PENDING");
        order.setCreatedAt(LocalDateTime.now());

        Order savedOrder = orderRepository.save(order);
        return ResponseEntity.ok(Map.of(
                "id", savedOrder.getId(),
                "status", savedOrder.getStatus(),
                "totalAmount", savedOrder.getTotalAmount(),
                "createdAt", savedOrder.getCreatedAt()
        ));
    }
}
