package com.example.globalmart_api.config;

import com.example.globalmart_api.model.Category;
import com.example.globalmart_api.model.Product;
import com.example.globalmart_api.repository.CategoryRepository;
import com.example.globalmart_api.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    @Override
    public void run(String... args) {
        if (productRepository.count() > 0 || categoryRepository.count() > 0) {
            System.out.println("Database already contains data. Skip sample initialization.");
            return;
        }

        // Create categories
        Category electronics = new Category(null, "Điện tử", "Các sản phẩm điện tử");
        Category fashion = new Category(null, "Thời trang", "Quần áo và phụ kiện");
        Category food = new Category(null, "Thực phẩm", "Thực phẩm và đồ uống");
        categoryRepository.saveAll(List.of(electronics, fashion, food));

        // Create products with Unsplash images
        List<Product> products = List.of(
                new Product(null, "Điện thoại Smartphone X", "Điện thoại thông minh mới nhất với màn hình 6.5 inch", 12990000, "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500", electronics.getId()),
                new Product(null, "Laptop Pro 15", "Laptop hiệu năng cao cho công việc và giải trí", 24990000, "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500", electronics.getId()),
                new Product(null, "Tai nghe không dây", "Tai nghe Bluetooth chất lượng cao với pin 30 giờ", 2990000, "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500", electronics.getId()),
                new Product(null, "Áo thun cotton", "Áo thun chất liệu cotton mềm mại", 299000, "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500", fashion.getId()),
                new Product(null, "Quần jeans nam", "Quần jeans thời trang, co giãn tốt", 599000, "https://images.unsplash.com/photo-1542272604-787c3835535d?w=500", fashion.getId()),
                new Product(null, "Giày sneaker", "Giày sneaker thoải mái cho mọi hoạt động", 899000, "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500", fashion.getId()),
                new Product(null, "Cà phê rang xay", "Cà phê chất lượng cao, hương vị đậm đà", 199000, "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500", food.getId()),
                new Product(null, "Bánh quy nhẹ", "Bánh quy ít đường, phù hợp cho ăn nhẹ", 49000, "https://images.unsplash.com/photo-1558961363-fe56e1088aa3?w=500", food.getId()),
                new Product(null, "Nước ép trái cây", "Nước ép 100% trái cây tự nhiên", 35000, "https://images.unsplash.com/photo-1502741224143-90386d7f8c82?w=500", food.getId())
        );
        productRepository.saveAll(products);

        System.out.println("Sample data initialized successfully!");
    }
}
