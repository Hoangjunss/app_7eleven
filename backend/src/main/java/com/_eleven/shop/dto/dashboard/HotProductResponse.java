package com._eleven.shop.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HotProductResponse {
    private Long id;
    private String name;
    private BigDecimal price;
    private String imageUrl;
    private long quantitySold;
}
