package com._eleven.shop.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderRequest {

    @NotBlank(message = "Recipient name is required")
    @Size(max = 255, message = "Recipient name cannot exceed 255 characters")
    private String recipientName;

    @NotBlank(message = "Recipient phone is required")
    @Size(max = 20, message = "Recipient phone cannot exceed 20 characters")
    private String recipientPhone;

    @NotBlank(message = "Delivery address is required")
    private String deliveryAddress;

    private String note;
}
