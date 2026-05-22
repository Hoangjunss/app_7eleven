package com._eleven.shop.service;

import com._eleven.shop.dto.CartResponse;

public interface CartService {
    void addItemToCart(Long userId, Long productId, int quantity);
    void updateCartItem(Long userId, Long productId, int quantity);
    void removeCartItem(Long userId, Long productId);
    void clearCart(Long userId);
    CartResponse getCart(Long userId);
}
