package com._eleven.shop.service;

import com._eleven.shop.dto.DashboardKpiResponse;
import com._eleven.shop.dto.OrderResponse;
import com._eleven.shop.dto.RevenueChartResponse;
import com._eleven.shop.dto.TopProductResponse;
import com._eleven.shop.entity.Order;
import com._eleven.shop.entity.OrderStatus;
import com._eleven.shop.entity.User;
import com._eleven.shop.repository.OrderItemRepository;
import com._eleven.shop.repository.OrderRepository;
import com._eleven.shop.repository.ProductRepository;
import com._eleven.shop.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class DashboardServiceTests {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private OrderItemRepository orderItemRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private DashboardServiceImpl dashboardService;

    @Test
    void testGetKpiSuccess() {
        OffsetDateTime start = OffsetDateTime.now().minusDays(7);
        OffsetDateTime end = OffsetDateTime.now();

        when(orderRepository.calculateTotalRevenueBetween(start, end)).thenReturn(new BigDecimal("250000"));
        when(productRepository.count()).thenReturn(15L);
        when(userRepository.count()).thenReturn(8L);

        List<Object[]> statusCounts = new ArrayList<>();
        statusCounts.add(new Object[]{OrderStatus.DELIVERED, 5L});
        statusCounts.add(new Object[]{OrderStatus.PENDING, 2L});
        when(orderRepository.countOrdersByStatusBetween(start, end)).thenReturn(statusCounts);

        DashboardKpiResponse kpi = dashboardService.getKpi(start, end);

        assertNotNull(kpi);
        assertEquals(new BigDecimal("250000"), kpi.getTotalRevenue());
        assertEquals(15L, kpi.getTotalProducts());
        assertEquals(8L, kpi.getTotalUsers());
        assertEquals(7L, kpi.getTotalOrders()); // 5 + 2
        assertEquals(5L, kpi.getOrderCountByStatus().get("DELIVERED"));
        assertEquals(2L, kpi.getOrderCountByStatus().get("PENDING"));
        assertEquals(0L, kpi.getOrderCountByStatus().get("CANCELLED")); // default value
    }

    @Test
    void testGetRevenueChartCalculatesCorrectlyAndPadsMissingDates() {
        // Test with 3 days range (e.g. today-2 to today)
        OffsetDateTime start = OffsetDateTime.now().minusDays(2).withHour(0).withMinute(0).withSecond(0).withNano(0);
        OffsetDateTime end = OffsetDateTime.now().withHour(23).withMinute(59).withSecond(59).withNano(999000000);

        List<Order> orders = new ArrayList<>();
        // Create an order for today
        orders.add(Order.builder()
                .totalAmount(new BigDecimal("150000"))
                .status(OrderStatus.DELIVERED)
                .createdAt(OffsetDateTime.now())
                .items(new ArrayList<>())
                .user(User.builder().id(1L).build())
                .build());

        when(orderRepository.findAllByStatusAndCreatedAtBetween(OrderStatus.DELIVERED, start, end)).thenReturn(orders);

        List<RevenueChartResponse> chart = dashboardService.getRevenueChart(start, end);

        assertNotNull(chart);
        assertEquals(3, chart.size()); // start, start+1, start+2 (today)
        
        // Today should have revenue, other days should be zero
        assertEquals(new BigDecimal("150000"), chart.get(2).getRevenue());
        assertEquals(1L, chart.get(2).getOrderCount());
        
        assertEquals(BigDecimal.ZERO, chart.get(0).getRevenue());
        assertEquals(0L, chart.get(0).getOrderCount());
        assertEquals(BigDecimal.ZERO, chart.get(1).getRevenue());
        assertEquals(0L, chart.get(1).getOrderCount());
    }

    @Test
    void testGetTopProductsSuccess() {
        OffsetDateTime start = OffsetDateTime.now().minusDays(7);
        OffsetDateTime end = OffsetDateTime.now();
        List<TopProductResponse> mockTop = List.of(
                new TopProductResponse(1L, "Product A", 10, new BigDecimal("100000")),
                new TopProductResponse(2L, "Product B", 5, new BigDecimal("50000"))
        );

        when(orderItemRepository.findTopSellingProductsBetween(start, end, PageRequest.of(0, 5))).thenReturn(mockTop);

        List<TopProductResponse> result = dashboardService.getTopProducts(start, end, 5);

        assertEquals(2, result.size());
        assertEquals("Product A", result.get(0).getProductName());
        assertEquals(10L, result.get(0).getTotalQuantitySold());
        assertEquals(new BigDecimal("100000"), result.get(0).getTotalRevenue());
    }

    @Test
    void testGetRecentOrdersSuccess() {
        List<Order> recentOrders = List.of(
                Order.builder()
                        .id(10L)
                        .orderCode("ORD-1")
                        .status(OrderStatus.PENDING)
                        .paymentMethod("COD")
                        .paymentStatus(com._eleven.shop.entity.PaymentStatus.PENDING)
                        .totalAmount(new BigDecimal("50000"))
                        .recipientName("Recipient")
                        .recipientPhone("123456")
                        .deliveryAddress("Address")
                        .createdAt(OffsetDateTime.now())
                        .updatedAt(OffsetDateTime.now())
                        .user(User.builder().id(1L).build())
                        .items(new ArrayList<>())
                        .build()
        );

        when(orderRepository.findRecentOrders(PageRequest.of(0, 5))).thenReturn(recentOrders);

        List<OrderResponse> result = dashboardService.getRecentOrders(5);

        assertEquals(1, result.size());
        assertEquals("ORD-1", result.get(0).getOrderCode());
        assertEquals("PENDING", result.get(0).getStatus());
        assertEquals(new BigDecimal("50000"), result.get(0).getTotalAmount());
    }
}
