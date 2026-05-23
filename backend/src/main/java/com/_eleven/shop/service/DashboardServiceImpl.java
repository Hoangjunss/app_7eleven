package com._eleven.shop.service;

import com._eleven.shop.dto.*;
import com._eleven.shop.entity.*;
import com._eleven.shop.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public DashboardKpiResponse getKpi(OffsetDateTime startDate, OffsetDateTime endDate) {
        BigDecimal totalRevenue = orderRepository.calculateTotalRevenueBetween(startDate, endDate);
        long totalProducts = productRepository.count();
        long totalUsers = userRepository.count();

        List<Object[]> statusCounts = orderRepository.countOrdersByStatusBetween(startDate, endDate);
        Map<String, Long> orderCountByStatus = new HashMap<>();
        
        // Initialize default order count to 0 for all statuses
        for (OrderStatus status : OrderStatus.values()) {
            orderCountByStatus.put(status.name(), 0L);
        }
        
        long totalOrders = 0;
        for (Object[] row : statusCounts) {
            OrderStatus status = (OrderStatus) row[0];
            Long count = (Long) row[1];
            orderCountByStatus.put(status.name(), count);
            totalOrders += count;
        }

        return DashboardKpiResponse.builder()
                .totalRevenue(totalRevenue)
                .totalOrders(totalOrders)
                .totalProducts(totalProducts)
                .totalUsers(totalUsers)
                .orderCountByStatus(orderCountByStatus)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<RevenueChartResponse> getRevenueChart(OffsetDateTime startDate, OffsetDateTime endDate) {
        // Query aggregated database records
        List<Object[]> rows = orderRepository.findRevenueChartData(OrderStatus.DELIVERED, startDate, endDate);

        // Pre-fill dates in TreeMap to guarantee sorted order and fill in empty days
        Map<LocalDate, BigDecimal> revenueMap = new TreeMap<>();
        Map<LocalDate, Long> countMap = new HashMap<>();

        LocalDate startLocalDate = startDate.toLocalDate();
        LocalDate endLocalDate = endDate.toLocalDate();
        for (LocalDate date = startLocalDate; !date.isAfter(endLocalDate); date = date.plusDays(1)) {
            revenueMap.put(date, BigDecimal.ZERO);
            countMap.put(date, 0L);
        }

        // Fill mapping from SQL rows with safe casting
        for (Object[] row : rows) {
            LocalDate dateVal = null;
            if (row[0] instanceof java.sql.Date sqlDate) {
                dateVal = sqlDate.toLocalDate();
            } else if (row[0] instanceof java.time.LocalDate localDate) {
                dateVal = localDate;
            } else if (row[0] instanceof java.util.Date utilDate) {
                dateVal = new java.sql.Date(utilDate.getTime()).toLocalDate();
            }

            BigDecimal revenue = BigDecimal.ZERO;
            if (row[1] instanceof BigDecimal bd) {
                revenue = bd;
            } else if (row[1] instanceof Number num) {
                revenue = BigDecimal.valueOf(num.doubleValue());
            }

            Long count = 0L;
            if (row[2] instanceof Number num) {
                count = num.longValue();
            }

            if (dateVal != null && revenueMap.containsKey(dateVal)) {
                revenueMap.put(dateVal, revenue);
                countMap.put(dateVal, count);
            }
        }

        return revenueMap.keySet().stream()
                .map(date -> new RevenueChartResponse(
                        date.toString(),
                        revenueMap.get(date),
                        countMap.get(date)
                ))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TopProductResponse> getTopProducts(OffsetDateTime startDate, OffsetDateTime endDate, int limit) {
        return orderItemRepository.findTopSellingProductsBetween(startDate, endDate, PageRequest.of(0, limit));
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> getRecentOrders(int limit) {
        List<Order> orders = orderRepository.findRecentOrders(PageRequest.of(0, limit));
        return orders.stream()
                .map(this::mapToOrderResponse)
                .collect(Collectors.toList());
    }

    private OrderResponse mapToOrderResponse(Order order) {
        List<OrderItemResponse> itemResponses = order.getItems().stream()
                .map(item -> OrderItemResponse.builder()
                        .id(item.getId())
                        .productId(item.getProductId())
                        .productNameSnapshot(item.getProductNameSnapshot())
                        .priceSnapshot(item.getPriceSnapshot())
                        .quantity(item.getQuantity())
                        .subtotal(item.getSubtotal())
                        .build())
                .toList();

        return OrderResponse.builder()
                .id(order.getId())
                .orderCode(order.getOrderCode())
                .userId(order.getUser().getId())
                .status(order.getStatus().name())
                .paymentMethod(order.getPaymentMethod())
                .paymentStatus(order.getPaymentStatus().name())
                .totalAmount(order.getTotalAmount())
                .recipientName(order.getRecipientName())
                .recipientPhone(order.getRecipientPhone())
                .deliveryAddress(order.getDeliveryAddress())
                .note(order.getNote())
                .items(itemResponses)
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }
}
