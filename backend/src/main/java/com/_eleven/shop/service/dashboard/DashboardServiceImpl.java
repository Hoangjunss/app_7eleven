package com._eleven.shop.service.dashboard;

import com._eleven.shop.dto.dashboard.*;
import com._eleven.shop.dto.product.ProductResponse;
import com._eleven.shop.dto.order.OrderResponse;
import com._eleven.shop.dto.order.OrderItemResponse;
import com._eleven.shop.entity.*;
import com._eleven.shop.repository.order.OrderItemRepository;
import com._eleven.shop.repository.order.OrderRepository;
import com._eleven.shop.repository.product.ProductRepository;
import com._eleven.shop.repository.user.UserRepository;
import com._eleven.shop.service.dashboard.DashboardService;
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
    private final com._eleven.shop.mapper.product.ProductMapper productMapper;

    private record DateMaps(Map<LocalDate, BigDecimal> revenueMap, Map<LocalDate, Long> countMap) {
    }

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

        DateMaps maps = preFillDateMaps(startDate, endDate);
        fillDataFromRows(rows, maps.revenueMap(), maps.countMap());

        return maps.revenueMap().keySet().stream()
                .map(date -> new RevenueChartResponse(
                        date.toString(),
                        maps.revenueMap().get(date),
                        maps.countMap().get(date)))
                .collect(Collectors.toList());
    }

    private DateMaps preFillDateMaps(OffsetDateTime startDate, OffsetDateTime endDate) {
        // Pre-fill dates in TreeMap to guarantee sorted order and fill in empty days
        Map<LocalDate, BigDecimal> revenueMap = new TreeMap<>();
        Map<LocalDate, Long> countMap = new HashMap<>();

        LocalDate startLocalDate = startDate.toLocalDate();
        LocalDate endLocalDate = endDate.toLocalDate();
        for (LocalDate date = startLocalDate; !date.isAfter(endLocalDate); date = date.plusDays(1)) {
            revenueMap.put(date, BigDecimal.ZERO);
            countMap.put(date, 0L);
        }
        return new DateMaps(revenueMap, countMap);
    }

    private void fillDataFromRows(List<Object[]> rows, Map<LocalDate, BigDecimal> revenueMap,
            Map<LocalDate, Long> countMap) {
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

    @Override
    @Transactional(readOnly = true)
    @org.springframework.cache.annotation.Cacheable(value = "revenueStats", key = "#startDate.toString() + '_' + #endDate.toString()")
    public RevenueDashboardResponse getRevenueStats(OffsetDateTime startDate, OffsetDateTime endDate) {
        BigDecimal totalRevenue = orderRepository.calculateTotalRevenueBetween(startDate, endDate);
        if (totalRevenue == null) {
            totalRevenue = BigDecimal.ZERO;
        }

        java.time.Duration duration = java.time.Duration.between(startDate, endDate);
        OffsetDateTime prevStartDate = startDate.minus(duration);
        OffsetDateTime prevEndDate = startDate;

        BigDecimal previousRevenue = orderRepository.calculateTotalRevenueBetween(prevStartDate, prevEndDate);
        if (previousRevenue == null) {
            previousRevenue = BigDecimal.ZERO;
        }

        double percentageChange = 0.0;
        if (previousRevenue.compareTo(BigDecimal.ZERO) > 0) {
            percentageChange = totalRevenue.subtract(previousRevenue)
                    .divide(previousRevenue, 4, java.math.RoundingMode.HALF_UP)
                    .doubleValue() * 100.0;
        } else if (totalRevenue.compareTo(BigDecimal.ZERO) > 0) {
            percentageChange = 100.0;
        }

        List<RevenueChartResponse> chartData = getRevenueChart(startDate, endDate);

        return RevenueDashboardResponse.builder()
                .totalRevenue(totalRevenue)
                .previousRevenue(previousRevenue)
                .percentageChange(percentageChange)
                .chartData(chartData)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    @org.springframework.cache.annotation.Cacheable(value = "orderStats", key = "#startDate.toString() + '_' + #endDate.toString()")
    public OrderStatsResponse getOrderStats(OffsetDateTime startDate, OffsetDateTime endDate) {
        List<Object[]> currentCounts = orderRepository.countOrdersByStatusBetween(startDate, endDate);
        long totalOrders = 0;
        Map<String, Long> statusDistribution = new HashMap<>();
        for (OrderStatus status : OrderStatus.values()) {
            statusDistribution.put(status.name(), 0L);
        }
        for (Object[] row : currentCounts) {
            OrderStatus status = (OrderStatus) row[0];
            Long count = (Long) row[1];
            statusDistribution.put(status.name(), count);
            totalOrders += count;
        }

        java.time.Duration duration = java.time.Duration.between(startDate, endDate);
        OffsetDateTime prevStartDate = startDate.minus(duration);
        OffsetDateTime prevEndDate = startDate;

        List<Object[]> prevCounts = orderRepository.countOrdersByStatusBetween(prevStartDate, prevEndDate);
        long previousOrders = 0;
        for (Object[] row : prevCounts) {
            previousOrders += (Long) row[1];
        }

        double percentageChange = 0.0;
        if (previousOrders > 0) {
            percentageChange = ((double) (totalOrders - previousOrders) / previousOrders) * 100.0;
        } else if (totalOrders > 0) {
            percentageChange = 100.0;
        }

        return OrderStatsResponse.builder()
                .totalOrders(totalOrders)
                .previousOrders(previousOrders)
                .percentageChange(percentageChange)
                .statusDistribution(statusDistribution)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    @org.springframework.cache.annotation.Cacheable(value = "topProductsMonth")
    public List<TopProductResponse> getTopProductsThisMonth() {
        OffsetDateTime now = OffsetDateTime.now();
        OffsetDateTime startOfMonth = now.withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
        return orderItemRepository.findTopSellingProductsBetween(startOfMonth, now, PageRequest.of(0, 5));
    }

    @Override
    @Transactional(readOnly = true)
    @org.springframework.cache.annotation.Cacheable(value = "userStats", key = "#startDate.toString() + '_' + #endDate.toString()")
    public UserStatsResponse getUserStats(OffsetDateTime startDate, OffsetDateTime endDate) {
        long totalUsers = userRepository.count();
        long newUsers = userRepository.countNewUsersBetween(startDate, endDate);
        long lockedUsers = userRepository.countLockedUsers();

        List<Object[]> rows = userRepository.findUserRegistrationsChart(startDate, endDate);

        Map<LocalDate, Long> registrationMap = new TreeMap<>();
        LocalDate startLocalDate = startDate.toLocalDate();
        LocalDate endLocalDate = endDate.toLocalDate();
        for (LocalDate date = startLocalDate; !date.isAfter(endLocalDate); date = date.plusDays(1)) {
            registrationMap.put(date, 0L);
        }

        for (Object[] row : rows) {
            LocalDate dateVal = null;
            if (row[0] instanceof java.sql.Date sqlDate) {
                dateVal = sqlDate.toLocalDate();
            } else if (row[0] instanceof java.time.LocalDate localDate) {
                dateVal = localDate;
            } else if (row[0] instanceof java.util.Date utilDate) {
                dateVal = new java.sql.Date(utilDate.getTime()).toLocalDate();
            }

            Long count = 0L;
            if (row[1] instanceof Number num) {
                count = num.longValue();
            }

            if (dateVal != null && registrationMap.containsKey(dateVal)) {
                registrationMap.put(dateVal, count);
            }
        }

        List<UserRegistrationChartResponse> chartData = registrationMap.keySet().stream()
                .map(date -> new UserRegistrationChartResponse(date.toString(), registrationMap.get(date)))
                .collect(Collectors.toList());

        return UserStatsResponse.builder()
                .totalUsers(totalUsers)
                .newUsers(newUsers)
                .lockedUsers(lockedUsers)
                .chartData(chartData)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    @org.springframework.cache.annotation.Cacheable(value = "categoryRevenue", key = "#startDate.toString() + '_' + #endDate.toString()")
    public List<CategoryRevenueResponse> getCategoryRevenues(OffsetDateTime startDate, OffsetDateTime endDate) {
        return orderItemRepository.findCategoryRevenueBetween(startDate, endDate);
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> getRecentOrdersForUser(Long userId) {
        org.springframework.data.domain.Page<Order> page = orderRepository.findByUserId(userId,
                PageRequest.of(0, 5, org.springframework.data.domain.Sort
                        .by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt")));
        return page.getContent().stream()
                .map(this::mapToOrderResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductResponse> getProductSuggestionsForUser(Long userId) {
        org.springframework.data.domain.Page<Order> userOrders = orderRepository.findByUserId(userId,
                PageRequest.of(0, 20, org.springframework.data.domain.Sort
                        .by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt")));
        List<Order> orders = userOrders.getContent();

        Set<Long> categoryIds = new HashSet<>();
        Set<Long> purchasedProductIds = new HashSet<>();
        for (Order order : orders) {
            for (OrderItem item : order.getItems()) {
                purchasedProductIds.add(item.getProductId());
                productRepository.findById(item.getProductId()).ifPresent(p -> {
                    if (p.getCategory() != null && p.getCategory().getDeletedAt() == null) {
                        categoryIds.add(p.getCategory().getId());
                    }
                });
            }
        }

        List<Product> suggestions = new ArrayList<>();
        if (!categoryIds.isEmpty()) {
            if (!purchasedProductIds.isEmpty()) {
                suggestions = productRepository.findSuggestionsByCategory(categoryIds, purchasedProductIds,
                        PageRequest.of(0, 5));
            } else {
                suggestions = productRepository.findSuggestionsByCategoryOnly(categoryIds, PageRequest.of(0, 5));
            }
        }

        // Fallback: If not enough suggestions, fill with latest products (excluding
        // already suggested and purchased products)
        if (suggestions.size() < 5) {
            Set<Long> excludeIds = new HashSet<>(purchasedProductIds);
            for (Product p : suggestions) {
                excludeIds.add(p.getId());
            }

            List<Product> latestProducts = productRepository.findLatestProducts(PageRequest.of(0, 20));
            for (Product p : latestProducts) {
                if (!excludeIds.contains(p.getId())) {
                    suggestions.add(p);
                    excludeIds.add(p.getId());
                    if (suggestions.size() >= 5) {
                        break;
                    }
                }
            }
        }

        // Final fallback if we still don't have enough, just add any latest products
        if (suggestions.size() < 5) {
            List<Product> latestProducts = productRepository.findLatestProducts(PageRequest.of(0, 5));
            for (Product p : latestProducts) {
                if (suggestions.stream().noneMatch(s -> s.getId().equals(p.getId()))) {
                    suggestions.add(p);
                    if (suggestions.size() >= 5) {
                        break;
                    }
                }
            }
        }

        // Limit to 5
        if (suggestions.size() > 5) {
            suggestions = suggestions.subList(0, 5);
        }

        return suggestions.stream()
                .map(productMapper::toResponse)
                .collect(Collectors.toList());
    }
}
