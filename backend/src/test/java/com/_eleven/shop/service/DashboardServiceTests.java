package com._eleven.shop.service;

import com._eleven.shop.dto.DashboardKpiResponse;
import com._eleven.shop.dto.OrderResponse;
import com._eleven.shop.dto.RevenueChartResponse;
import com._eleven.shop.dto.TopProductResponse;
import com._eleven.shop.entity.Order;
import com._eleven.shop.entity.OrderItem;
import com._eleven.shop.entity.OrderStatus;
import com._eleven.shop.entity.User;
import java.util.Optional;
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
import java.time.LocalDate;
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

    @Mock
    private com._eleven.shop.mapper.ProductMapper productMapper;

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

        List<Object[]> mockChartData = new ArrayList<>();
        // Add row for today (which is start + 2 days)
        mockChartData.add(new Object[]{
                LocalDate.now(),
                new BigDecimal("150000"),
                1L
        });

        when(orderRepository.findRevenueChartData(OrderStatus.DELIVERED, start, end)).thenReturn(mockChartData);

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

    @Test
    void testGetRevenueStats() {
        OffsetDateTime end = OffsetDateTime.now();
        OffsetDateTime start = end.minusDays(7);
        java.time.Duration duration = java.time.Duration.between(start, end);
        OffsetDateTime prevStart = start.minus(duration);

        when(orderRepository.calculateTotalRevenueBetween(start, end)).thenReturn(new BigDecimal("10000"));
        when(orderRepository.calculateTotalRevenueBetween(prevStart, start)).thenReturn(new BigDecimal("5000"));

        List<Object[]> mockChartData = new ArrayList<>();
        when(orderRepository.findRevenueChartData(OrderStatus.DELIVERED, start, end)).thenReturn(mockChartData);

        com._eleven.shop.dto.RevenueDashboardResponse response = dashboardService.getRevenueStats(start, end);

        assertNotNull(response);
        assertEquals(new BigDecimal("10000"), response.getTotalRevenue());
        assertEquals(new BigDecimal("5000"), response.getPreviousRevenue());
        assertEquals(100.0, response.getPercentageChange());
    }

    @Test
    void testGetOrderStats() {
        OffsetDateTime end = OffsetDateTime.now();
        OffsetDateTime start = end.minusDays(7);
        java.time.Duration duration = java.time.Duration.between(start, end);
        OffsetDateTime prevStart = start.minus(duration);

        List<Object[]> currentCounts = new ArrayList<>();
        currentCounts.add(new Object[]{OrderStatus.DELIVERED, 10L});
        List<Object[]> prevCounts = new ArrayList<>();
        prevCounts.add(new Object[]{OrderStatus.DELIVERED, 5L});

        when(orderRepository.countOrdersByStatusBetween(start, end)).thenReturn(currentCounts);
        when(orderRepository.countOrdersByStatusBetween(prevStart, start)).thenReturn(prevCounts);

        com._eleven.shop.dto.OrderStatsResponse response = dashboardService.getOrderStats(start, end);

        assertNotNull(response);
        assertEquals(10, response.getTotalOrders());
        assertEquals(5, response.getPreviousOrders());
        assertEquals(100.0, response.getPercentageChange());
        assertEquals(10L, response.getStatusDistribution().get("DELIVERED"));
    }

    @Test
    void testGetTopProductsThisMonth() {
        List<TopProductResponse> mockTop = List.of(
                new TopProductResponse(1L, "Product A", 10, new BigDecimal("100000"))
        );
        when(orderItemRepository.findTopSellingProductsBetween(any(), any(), eq(PageRequest.of(0, 5)))).thenReturn(mockTop);

        List<TopProductResponse> result = dashboardService.getTopProductsThisMonth();
        assertEquals(1, result.size());
        assertEquals("Product A", result.get(0).getProductName());
    }

    @Test
    void testGetLowStockProducts() {
        com._eleven.shop.entity.Product product = com._eleven.shop.entity.Product.builder().id(1L).name("P1").build();
        com._eleven.shop.dto.ProductResponse response = com._eleven.shop.dto.ProductResponse.builder().id(1L).name("P1").build();

        when(productRepository.findLowStockProducts(PageRequest.of(0, 10))).thenReturn(List.of(product));
        when(productMapper.toResponse(product)).thenReturn(response);

        List<com._eleven.shop.dto.ProductResponse> result = dashboardService.getLowStockProducts();
        assertEquals(1, result.size());
        assertEquals("P1", result.get(0).getName());
    }

    @Test
    void testGetNoOrderProducts30Days() {
        com._eleven.shop.entity.Product product = com._eleven.shop.entity.Product.builder().id(1L).name("P2").build();
        com._eleven.shop.dto.ProductResponse response = com._eleven.shop.dto.ProductResponse.builder().id(1L).name("P2").build();

        when(productRepository.findProductsWithNoOrdersSince(any(), eq(PageRequest.of(0, 10)))).thenReturn(List.of(product));
        when(productMapper.toResponse(product)).thenReturn(response);

        List<com._eleven.shop.dto.ProductResponse> result = dashboardService.getNoOrderProducts30Days();
        assertEquals(1, result.size());
        assertEquals("P2", result.get(0).getName());
    }

    @Test
    void testGetUserStats() {
        OffsetDateTime end = OffsetDateTime.now();
        OffsetDateTime start = end.minusDays(2).withHour(0).withMinute(0).withSecond(0).withNano(0);

        when(userRepository.count()).thenReturn(100L);
        when(userRepository.countNewUsersBetween(start, end)).thenReturn(10L);
        when(userRepository.countLockedUsers()).thenReturn(5L);

        List<Object[]> registrations = new ArrayList<>();
        registrations.add(new Object[]{LocalDate.now(), 4L});
        when(userRepository.findUserRegistrationsChart(start, end)).thenReturn(registrations);

        com._eleven.shop.dto.UserStatsResponse response = dashboardService.getUserStats(start, end);

        assertNotNull(response);
        assertEquals(100L, response.getTotalUsers());
        assertEquals(10L, response.getNewUsers());
        assertEquals(5L, response.getLockedUsers());
        assertEquals(3, response.getChartData().size());
    }

    @Test
    void testGetCategoryRevenues() {
        List<com._eleven.shop.dto.CategoryRevenueResponse> mockRevenues = List.of(
                new com._eleven.shop.dto.CategoryRevenueResponse(1L, "Category A", new BigDecimal("1000"))
        );
        when(orderItemRepository.findCategoryRevenueBetween(any(), any())).thenReturn(mockRevenues);

        List<com._eleven.shop.dto.CategoryRevenueResponse> result = dashboardService.getCategoryRevenues(OffsetDateTime.now().minusDays(1), OffsetDateTime.now());
        assertEquals(1, result.size());
        assertEquals("Category A", result.get(0).getCategoryName());
    }

    @Test
    void testGetRecentOrdersForUser() {
        Order order = Order.builder()
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
                .build();
        org.springframework.data.domain.Page<Order> page = new org.springframework.data.domain.PageImpl<>(List.of(order));

        when(orderRepository.findByUserId(eq(1L), any(Pageable.class))).thenReturn(page);

        List<OrderResponse> result = dashboardService.getRecentOrdersForUser(1L);
        assertEquals(1, result.size());
        assertEquals("ORD-1", result.get(0).getOrderCode());
    }

    @Test
    void testGetProductSuggestionsForUser() {
        com._eleven.shop.entity.Category cat = com._eleven.shop.entity.Category.builder().id(1L).name("Cat1").build();
        com._eleven.shop.entity.Product product1 = com._eleven.shop.entity.Product.builder().id(1L).category(cat).build();
        OrderItem item = OrderItem.builder().productId(1L).build();
        Order order = Order.builder().items(List.of(item)).build();
        org.springframework.data.domain.Page<Order> page = new org.springframework.data.domain.PageImpl<>(List.of(order));

        when(orderRepository.findByUserId(eq(1L), any(Pageable.class))).thenReturn(page);
        when(productRepository.findById(1L)).thenReturn(Optional.of(product1));

        com._eleven.shop.entity.Product suggestionProduct = com._eleven.shop.entity.Product.builder().id(2L).name("P2").category(cat).build();

        when(productRepository.findSuggestionsByCategory(any(), any(), any(Pageable.class)))
                .thenReturn(new ArrayList<>(List.of(suggestionProduct)));

        List<com._eleven.shop.entity.Product> fallbackLatest = List.of(
                com._eleven.shop.entity.Product.builder().id(3L).name("P3").build(),
                com._eleven.shop.entity.Product.builder().id(4L).name("P4").build(),
                com._eleven.shop.entity.Product.builder().id(5L).name("P5").build(),
                com._eleven.shop.entity.Product.builder().id(6L).name("P6").build()
        );
        when(productRepository.findLatestProducts(any(Pageable.class))).thenReturn(new ArrayList<>(fallbackLatest));

        when(productMapper.toResponse(any(com._eleven.shop.entity.Product.class))).thenAnswer(invocation -> {
            com._eleven.shop.entity.Product p = invocation.getArgument(0);
            return com._eleven.shop.dto.ProductResponse.builder().id(p.getId()).name(p.getName()).build();
        });

        List<com._eleven.shop.dto.ProductResponse> result = dashboardService.getProductSuggestionsForUser(1L);
        assertEquals(5, result.size());
    }
}
