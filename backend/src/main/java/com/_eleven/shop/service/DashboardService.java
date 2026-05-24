package com._eleven.shop.service;

import com._eleven.shop.dto.*;

import java.time.OffsetDateTime;
import java.util.List;

public interface DashboardService {
    DashboardKpiResponse getKpi(OffsetDateTime startDate, OffsetDateTime endDate);
    List<RevenueChartResponse> getRevenueChart(OffsetDateTime startDate, OffsetDateTime endDate);
    List<TopProductResponse> getTopProducts(OffsetDateTime startDate, OffsetDateTime endDate, int limit);
    List<OrderResponse> getRecentOrders(int limit);

    RevenueDashboardResponse getRevenueStats(OffsetDateTime startDate, OffsetDateTime endDate);
    OrderStatsResponse getOrderStats(OffsetDateTime startDate, OffsetDateTime endDate);
    List<TopProductResponse> getTopProductsThisMonth();
    List<ProductResponse> getLowStockProducts();
    List<ProductResponse> getNoOrderProducts30Days();
    UserStatsResponse getUserStats(OffsetDateTime startDate, OffsetDateTime endDate);
    List<CategoryRevenueResponse> getCategoryRevenues(OffsetDateTime startDate, OffsetDateTime endDate);
    List<OrderResponse> getRecentOrdersForUser(Long userId);
    List<ProductResponse> getProductSuggestionsForUser(Long userId);
}
