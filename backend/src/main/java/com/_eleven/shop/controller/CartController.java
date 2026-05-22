package com._eleven.shop.controller;

import com._eleven.shop.dto.ApiResponse;
import com._eleven.shop.dto.CartItemResponse;
import com._eleven.shop.dto.CartResponse;
import com._eleven.shop.entity.User;
import com._eleven.shop.repository.UserRepository;
import com._eleven.shop.service.CartService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/cart")
@RequiredArgsConstructor
@Slf4j
@Validated
public class CartController {

    private final CartService cartService;
    private final UserRepository userRepository;

    private Long getUserId(UserDetails userDetails) {
        if (userDetails == null) {
            throw new IllegalArgumentException("User not authenticated");
        }
        return userRepository.findByEmail(userDetails.getUsername())
                .map(User::getId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    @GetMapping
    public ApiResponse<CartResponse> getCart(@AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        CartResponse cart = cartService.getCart(userId);
        return ApiResponse.success(cart, "Cart retrieved successfully");
    }

    @PostMapping("/items")
    public ApiResponse<Void> addItem(@AuthenticationPrincipal UserDetails userDetails,
                                      @RequestBody @Valid AddItemRequest req) {
        Long userId = getUserId(userDetails);
        cartService.addItemToCart(userId, req.getProductId(), req.getQuantity());
        return ApiResponse.success(null, "Item added to cart successfully");
    }

    @PutMapping("/items/{productId}")
    public ApiResponse<Void> updateItem(@AuthenticationPrincipal UserDetails userDetails,
                                         @PathVariable Long productId,
                                         @RequestBody @Valid UpdateItemRequest req) {
        Long userId = getUserId(userDetails);
        cartService.updateCartItem(userId, productId, req.getQuantity());
        return ApiResponse.success(null, "Cart item updated successfully");
    }

    @DeleteMapping("/items/{productId}")
    public ApiResponse<Void> removeItem(@AuthenticationPrincipal UserDetails userDetails,
                                         @PathVariable Long productId) {
        Long userId = getUserId(userDetails);
        cartService.removeCartItem(userId, productId);
        return ApiResponse.success(null, "Item removed from cart successfully");
    }

    @DeleteMapping
    public ApiResponse<Void> clearCart(@AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        cartService.clearCart(userId);
        return ApiResponse.success(null, "Cart cleared successfully");
    }

    @Data
    public static class AddItemRequest {
        @Min(value = 1, message = "Product ID must be greater than or equal to 1")
        private Long productId;

        @Min(value = 1, message = "Quantity must be greater than or equal to 1")
        private int quantity;
    }

    @Data
    public static class UpdateItemRequest {
        @Min(value = 1, message = "Quantity must be greater than or equal to 1")
        private int quantity;
    }
}
