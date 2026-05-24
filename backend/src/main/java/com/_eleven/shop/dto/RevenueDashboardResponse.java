package com._eleven.shop.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RevenueDashboardResponse {
    private BigDecimal totalRevenue;
    private BigDecimal previousRevenue;
    private double percentageChange;
    private List<RevenueChartResponse> chartData;
}
