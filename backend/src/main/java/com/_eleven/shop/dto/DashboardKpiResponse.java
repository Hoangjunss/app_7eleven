package com._eleven.shop.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardKpiResponse {
    private BigDecimal totalRevenue;
    private long totalOrders;
    private long totalProducts;
    private long totalUsers;
    private Map<String, Long> orderCountByStatus;
}
