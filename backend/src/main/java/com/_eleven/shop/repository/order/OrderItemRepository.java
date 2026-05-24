package com._eleven.shop.repository.order;
import com._eleven.shop.dto.dashboard.CategoryRevenueResponse;

import com._eleven.shop.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com._eleven.shop.dto.dashboard.TopProductResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.OffsetDateTime;
import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    
    @Query("SELECT new com._eleven.shop.dto.dashboard.TopProductResponse(oi.productId, oi.productNameSnapshot, SUM(oi.quantity), SUM(oi.subtotal)) " +
           "FROM OrderItem oi " +
           "WHERE oi.order.status = com._eleven.shop.entity.OrderStatus.DELIVERED " +
           "  AND oi.order.createdAt >= :startDate " +
           "  AND oi.order.createdAt <= :endDate " +
           "GROUP BY oi.productId, oi.productNameSnapshot " +
           "ORDER BY SUM(oi.quantity) DESC")
    List<TopProductResponse> findTopSellingProductsBetween(@Param("startDate") OffsetDateTime startDate, @Param("endDate") OffsetDateTime endDate, Pageable pageable);

    @Query("SELECT new com._eleven.shop.dto.dashboard.CategoryRevenueResponse(p.category.id, p.category.name, SUM(oi.subtotal)) " +
           "FROM OrderItem oi JOIN Product p ON oi.productId = p.id " +
           "WHERE oi.order.status = com._eleven.shop.entity.OrderStatus.DELIVERED " +
           "  AND oi.order.createdAt >= :startDate " +
           "  AND oi.order.createdAt <= :endDate " +
           "GROUP BY p.category.id, p.category.name " +
           "ORDER BY SUM(oi.subtotal) DESC")
    List<com._eleven.shop.dto.dashboard.CategoryRevenueResponse> findCategoryRevenueBetween(@Param("startDate") OffsetDateTime startDate, @Param("endDate") OffsetDateTime endDate);
}
