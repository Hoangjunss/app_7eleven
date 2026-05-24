package com._eleven.shop.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.io.Serializable;
import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RevenueDashboardResponse implements Serializable {
    private static final long serialVersionUID = 1L;

    private BigDecimal totalRevenue;
    private BigDecimal previousRevenue;
    private double percentageChange;
    private List<RevenueChartResponse> chartData;
}
