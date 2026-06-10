package com.example.globalmart_api.repository;

import com.example.globalmart_api.model.Category;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CategoryRepository extends MongoRepository<Category, String> {
    Optional<Category> findByNumericId(long numericId);
}
