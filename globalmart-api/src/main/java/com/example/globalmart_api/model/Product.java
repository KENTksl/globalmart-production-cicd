package com.example.globalmart_api.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "products")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Product {
    @Id
    private String id;
    @Indexed(unique = true)
    private long numericId;
    private String name;
    private String description;
    private double price;
    private String image;
    private String categoryId;
}
