package com._eleven.shop.dto.product;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.io.Serializable;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductImageResponse implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long id;
    private String imageUrl;
    private Boolean isPrimary;
}
