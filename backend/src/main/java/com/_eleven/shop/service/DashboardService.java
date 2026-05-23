package com._eleven.shop.service;

import com._eleven.shop.dto.DashboardKpiResponse;
import com._eleven.shop.dto.OrderResponse;
import com._eleven.shop.dto.RevenueChartResponse;
import com._eleven.shop.dto.TopProductResponse;

import java.time.OffsetDateTime;
import java.util.List;

public interface DashboardService {
    DashboardKpiResponse getKpi(OffsetDateTime startDate, OffsetDateTime endDate);
    List<RevenueChartResponse> getRevenueChart(OffsetDateTime startDate, OffsetDateTime endDate);
    List<TopProductResponse> getTopProducts(OffsetDateTime startDate, OffsetDateTime endDate, int limit);
    List<OrderResponse> getRecentOrders(int limit);
}
