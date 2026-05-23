package com._eleven.shop.repository;

import com._eleven.shop.entity.Order;
import com._eleven.shop.entity.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    Page<Order> findByUserIdAndStatus(Long userId, OrderStatus status, Pageable pageable);
    Page<Order> findByUserId(Long userId, Pageable pageable);
    Page<Order> findByStatus(OrderStatus status, Pageable pageable);
    Optional<Order> findByIdAndUserId(Long orderId, Long userId);
    Optional<Order> findByOrderCode(String orderCode);

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.status = com._eleven.shop.entity.OrderStatus.DELIVERED AND o.createdAt >= :startDate AND o.createdAt <= :endDate")
    java.math.BigDecimal calculateTotalRevenueBetween(@Param("startDate") OffsetDateTime startDate, @Param("endDate") OffsetDateTime endDate);

    @Query("SELECT o.status, COUNT(o) FROM Order o WHERE o.createdAt >= :startDate AND o.createdAt <= :endDate GROUP BY o.status")
    List<Object[]> countOrdersByStatusBetween(@Param("startDate") OffsetDateTime startDate, @Param("endDate") OffsetDateTime endDate);

    List<Order> findAllByStatusAndCreatedAtBetween(OrderStatus status, OffsetDateTime startDate, OffsetDateTime endDate);

    @Query("SELECT o FROM Order o ORDER BY o.createdAt DESC")
    List<Order> findRecentOrders(Pageable pageable);
}
