package com._eleven.shop.repository.product;

import com._eleven.shop.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {
    @Query("SELECT DISTINCT p FROM Product p LEFT JOIN FETCH p.images WHERE p.id IN :ids")
    List<Product> findAllByIdsWithImages(@Param("ids") Collection<Long> ids);

    @Query("SELECT COUNT(p) > 0 FROM Product p WHERE LOWER(TRIM(p.name)) = LOWER(TRIM(:name))")
    boolean existsByNameIgnoreCaseAndTrimmed(@Param("name") String name);

    @Query("SELECT COUNT(p) > 0 FROM Product p WHERE LOWER(TRIM(p.name)) = LOWER(TRIM(:name)) AND p.id <> :id")
    boolean existsByNameIgnoreCaseAndTrimmedForUpdate(@Param("name") String name, @Param("id") Long id);

    @Query("SELECT p FROM Product p WHERE p.deletedAt IS NULL ORDER BY p.stockQuantity ASC")
    List<Product> findLowStockProducts(org.springframework.data.domain.Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.deletedAt IS NULL AND p.category.id IN :categoryIds AND p.id NOT IN :excludeIds")
    List<Product> findSuggestionsByCategory(@Param("categoryIds") Collection<Long> categoryIds, @Param("excludeIds") Collection<Long> excludeIds, org.springframework.data.domain.Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.deletedAt IS NULL AND p.category.id IN :categoryIds")
    List<Product> findSuggestionsByCategoryOnly(@Param("categoryIds") Collection<Long> categoryIds, org.springframework.data.domain.Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.deletedAt IS NULL ORDER BY p.createdAt DESC")
    List<Product> findLatestProducts(org.springframework.data.domain.Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.deletedAt IS NULL AND p.id NOT IN (" +
           "  SELECT DISTINCT oi.productId FROM OrderItem oi " +
           "  WHERE oi.order.status IN (com._eleven.shop.entity.OrderStatus.CONFIRMED, com._eleven.shop.entity.OrderStatus.SHIPPING, com._eleven.shop.entity.OrderStatus.DELIVERED) " +
           "    AND oi.order.createdAt >= :sinceDate" +
           ") ORDER BY p.createdAt DESC")
    List<Product> findProductsWithNoOrdersSince(@Param("sinceDate") OffsetDateTime sinceDate, org.springframework.data.domain.Pageable pageable);

    @Query(value = "SELECT COUNT(*) > 0 FROM products WHERE category_id = :categoryId", nativeQuery = true)
    boolean existsByCategoryId(@Param("categoryId") Long categoryId);
}
