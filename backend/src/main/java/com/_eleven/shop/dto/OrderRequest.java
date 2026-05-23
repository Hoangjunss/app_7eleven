package com._eleven.shop.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
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
    @Pattern(regexp = "^[0-9]{9,11}$", message = "Invalid phone number format (9-11 digits)")
    private String recipientPhone;

    @NotBlank(message = "Delivery address is required")
    @Size(max = 500, message = "Delivery address cannot exceed 500 characters")
    private String deliveryAddress;

    @Size(max = 500, message = "Note cannot exceed 500 characters")
    private String note;
}
