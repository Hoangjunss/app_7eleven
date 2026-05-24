package com._eleven.shop.service;

import com._eleven.shop.entity.Category;
import com._eleven.shop.entity.Product;
import com._eleven.shop.repository.category.CategoryRepository;
import com._eleven.shop.repository.product.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
@ActiveProfiles("test")
public class ProductOptimisticLockingTests {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private PlatformTransactionManager transactionManager;

    // We mock Cloudinary to avoid external calls or missing credentials errors
    @MockBean
    private CloudinaryStorageService cloudinaryStorageService;

    private Long productId;
    private TransactionTemplate transactionTemplate;

    @BeforeEach
    void setUp() {
        transactionTemplate = new TransactionTemplate(transactionManager);

        // Prepare clean database state
        transactionTemplate.execute(status -> {
            productRepository.deleteAll();
            categoryRepository.deleteAll();

            Category category = Category.builder()
                    .name("Electronics")
                    .build();
            Category savedCategory = categoryRepository.save(category);

            Product product = Product.builder()
                    .name("Smart Phone")
                    .price(BigDecimal.valueOf(999.99))
                    .stockQuantity(100)
                    .category(savedCategory)
                    .build();
            Product savedProduct = productRepository.save(product);
            productId = savedProduct.getId();
            return null;
        });
    }

    @Test
    void testOptimisticLockingOnStockQuantityUpdate() {
        // 1. Thread/Transaction 1 reads the product
        Product product1 = transactionTemplate.execute(status -> 
            productRepository.findById(productId).orElseThrow()
        );

        // 2. Thread/Transaction 2 reads the same product (same version = 0)
        Product product2 = transactionTemplate.execute(status -> 
            productRepository.findById(productId).orElseThrow()
        );

        // Check that both loaded instances have the initial version (usually 0)
        assertEquals(product1.getVersion(), product2.getVersion());

        // 3. Transaction 1 updates the stock and commits (version increments to 1)
        transactionTemplate.execute(status -> {
            product1.setStockQuantity(90);
            productRepository.save(product1);
            return null;
        });

        // 4. Transaction 2 attempts to update the stock using the stale instance (version 0)
        // This must throw ObjectOptimisticLockingFailureException on commit/flush
        assertThrows(ObjectOptimisticLockingFailureException.class, () -> {
            transactionTemplate.execute(status -> {
                product2.setStockQuantity(80);
                productRepository.save(product2);
                // Force Hibernate to flush changes to the database within this transaction
                productRepository.flush();
                return null;
            });
        });

        // 5. Verify the stock quantity remains 90 (first commit) and version is 1
        Product finalProduct = transactionTemplate.execute(status -> 
            productRepository.findById(productId).orElseThrow()
        );
        assertEquals(90, finalProduct.getStockQuantity());
        assertEquals(1, finalProduct.getVersion());
    }
}
