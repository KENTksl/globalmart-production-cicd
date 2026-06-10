package com.example.globalmart_api.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Order {
    @Id
    private String id;
    private String userId;
    private List<OrderItem> items;
    private double totalAmount;
    private String status;
    private LocalDateTime createdAt;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderItem {
        private String productId;
        private int quantity;
        private double price;
    }
}
