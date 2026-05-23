package com._eleven.shop.repository;

import com._eleven.shop.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com._eleven.shop.dto.TopProductResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.OffsetDateTime;
import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    
    @Query("SELECT new com._eleven.shop.dto.TopProductResponse(oi.productId, oi.productNameSnapshot, SUM(oi.quantity), SUM(oi.subtotal)) " +
           "FROM OrderItem oi " +
           "WHERE oi.order.status = com._eleven.shop.entity.OrderStatus.DELIVERED " +
           "  AND oi.order.createdAt >= :startDate " +
           "  AND oi.order.createdAt <= :endDate " +
           "GROUP BY oi.productId, oi.productNameSnapshot " +
           "ORDER BY SUM(oi.quantity) DESC")
    List<TopProductResponse> findTopSellingProductsBetween(@Param("startDate") OffsetDateTime startDate, @Param("endDate") OffsetDateTime endDate, Pageable pageable);
}
