package com._eleven.shop.service.order;

import com._eleven.shop.dto.order.OrderRequest;
import com._eleven.shop.dto.order.OrderResponse;
import com._eleven.shop.entity.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface OrderService {
    OrderResponse createOrder(Long userId, OrderRequest request);
    Page<OrderResponse> getOrdersForUser(Long userId, OrderStatus status, Pageable pageable);
    OrderResponse getOrderDetails(Long userId, Long orderId);
    void cancelOrder(Long userId, Long orderId);
    
    // Admin methods
    Page<OrderResponse> getAllOrders(OrderStatus status, Long userId, Pageable pageable);
    OrderResponse getOrderById(Long orderId);
    OrderResponse updateOrderStatus(Long orderId, OrderStatus newStatus);
}
