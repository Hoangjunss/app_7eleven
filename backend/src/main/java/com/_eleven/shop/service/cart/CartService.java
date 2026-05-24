package com._eleven.shop.service.cart;

import com._eleven.shop.dto.cart.CartResponse;

public interface CartService {
    void addItemToCart(Long userId, Long productId, int quantity);
    void updateCartItem(Long userId, Long productId, int quantity);
    void removeCartItem(Long userId, Long productId);
    void clearCart(Long userId);
    CartResponse getCart(Long userId);
}
