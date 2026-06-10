package com.example.globalmart_api.repository;

import com.example.globalmart_api.model.Product;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends MongoRepository<Product, String> {
    Optional<Product> findByNumericId(long numericId);
    List<Product> findByCategoryId(String categoryId);
}
