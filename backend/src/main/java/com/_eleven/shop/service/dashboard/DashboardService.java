package com._eleven.shop.service.dashboard;

import com._eleven.shop.dto.common.*;
import com._eleven.shop.dto.auth.*;
import com._eleven.shop.dto.product.*;
import com._eleven.shop.dto.order.*;
import com._eleven.shop.dto.user.*;
import com._eleven.shop.dto.category.*;
import com._eleven.shop.dto.cart.*;
import com._eleven.shop.dto.dashboard.*;

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
    UserStatsResponse getUserStats(OffsetDateTime startDate, OffsetDateTime endDate);
    List<CategoryRevenueResponse> getCategoryRevenues(OffsetDateTime startDate, OffsetDateTime endDate);
    List<OrderResponse> getRecentOrdersForUser(Long userId);
    List<ProductResponse> getProductSuggestionsForUser(Long userId);
}
