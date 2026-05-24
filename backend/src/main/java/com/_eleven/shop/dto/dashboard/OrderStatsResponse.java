package com._eleven.shop.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.io.Serializable;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderStatsResponse implements Serializable {
    private static final long serialVersionUID = 1L;

    private long totalOrders;
    private long previousOrders;
    private double percentageChange;
    private Map<String, Long> statusDistribution;
}
