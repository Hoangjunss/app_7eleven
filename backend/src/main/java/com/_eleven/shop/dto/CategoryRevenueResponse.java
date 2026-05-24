package com._eleven.shop.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryRevenueResponse {
    private Long categoryId;
    private String categoryName;
    private BigDecimal revenue;
}
