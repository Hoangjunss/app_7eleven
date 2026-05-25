package com._eleven.shop.controller.admin;

import com._eleven.shop.dto.common.*;
import com._eleven.shop.dto.auth.*;
import com._eleven.shop.dto.product.*;
import com._eleven.shop.dto.order.*;
import com._eleven.shop.dto.user.*;
import com._eleven.shop.dto.category.*;
import com._eleven.shop.dto.cart.*;
import com._eleven.shop.dto.dashboard.*;
import com._eleven.shop.service.dashboard.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/dashboard")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminDashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/kpi")
    public ResponseEntity<ApiResponse<DashboardKpiResponse>> getKpi(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime endDate) {
        DashboardKpiResponse data = dashboardService.getKpi(startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @GetMapping("/revenue")
    public ResponseEntity<ApiResponse<List<RevenueChartResponse>>> getRevenueChart(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime endDate) {
        List<RevenueChartResponse> data = dashboardService.getRevenueChart(startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @GetMapping("/top-products")
    public ResponseEntity<ApiResponse<List<TopProductResponse>>> getTopProducts(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime endDate,
            @RequestParam(defaultValue = "5") int limit) {
        List<TopProductResponse> data = dashboardService.getTopProducts(startDate, endDate, limit);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @GetMapping("/recent-orders")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getRecentOrders(
            @RequestParam(defaultValue = "5") int limit) {
        List<OrderResponse> data = dashboardService.getRecentOrders(limit);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @GetMapping("/revenue-stats")
    public ResponseEntity<ApiResponse<RevenueDashboardResponse>> getRevenueStats(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime endDate) {
        RevenueDashboardResponse data = dashboardService.getRevenueStats(startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @GetMapping("/order-stats")
    public ResponseEntity<ApiResponse<OrderStatsResponse>> getOrderStats(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime endDate) {
        OrderStatsResponse data = dashboardService.getOrderStats(startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @GetMapping("/user-stats")
    public ResponseEntity<ApiResponse<UserStatsResponse>> getUserStats(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime endDate) {
        UserStatsResponse data = dashboardService.getUserStats(startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @GetMapping("/category-revenue")
    public ResponseEntity<ApiResponse<List<CategoryRevenueResponse>>> getCategoryRevenue(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime endDate) {
        List<CategoryRevenueResponse> data = dashboardService.getCategoryRevenues(startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(data));
    }
}
