package com._eleven.shop.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.io.Serializable;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TopProductResponse implements Serializable {
    private static final long serialVersionUID = 1L;
    private Long productId;
    private String productName;
    private long totalQuantitySold;
    private BigDecimal totalRevenue;
}
