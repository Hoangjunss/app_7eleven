package com._eleven.shop.service.cart;

import com._eleven.shop.dto.cart.CartItemResponse;
import com._eleven.shop.dto.cart.CartResponse;
import com._eleven.shop.entity.Product;
import com._eleven.shop.repository.product.ProductRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.HashOperations;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Slf4j
public class CartServiceImpl implements CartService {

    private static final String CART_KEY_PREFIX = "cart:";
    private static final Duration CART_TTL = Duration.ofDays(7);

    private final RedisTemplate<String, Object> redisTemplate;
    private final ProductRepository productRepository;

    @Autowired
    public CartServiceImpl(RedisTemplate<String, Object> redisTemplate,
            ProductRepository productRepository) {
        this.redisTemplate = redisTemplate;
        this.productRepository = productRepository;
    }

    @SuppressWarnings("unchecked")
    private HashOperations<String, String, Integer> hashOps() {
        return (HashOperations<String, String, Integer>) (HashOperations) redisTemplate.opsForHash();
    }

    private String cartKey(Long userId) {
        return CART_KEY_PREFIX + userId;
    }

    @Override
    public void addItemToCart(Long userId, Long productId, int quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Quantity must be positive");
        }
        String key = cartKey(userId);
        // Increment existing quantity atomically
        hashOps().increment(key, productId.toString(), quantity);
        redisTemplate.expire(key, CART_TTL);
    }

    @Override
    public void updateCartItem(Long userId, Long productId, int quantity) {
        String key = cartKey(userId);
        if (quantity <= 0) {
            // If quantity is zero or negative, remove the item
            hashOps().delete(key, productId.toString());
        } else {
            hashOps().put(key, productId.toString(), quantity);
        }
        redisTemplate.expire(key, CART_TTL);
    }

    @Override
    public void removeCartItem(Long userId, Long productId) {
        String key = cartKey(userId);
        hashOps().delete(key, productId.toString());
        redisTemplate.expire(key, CART_TTL);
    }

    @Override
    public void clearCart(Long userId) {
        String key = cartKey(userId);
        redisTemplate.delete(key);
    }

    @Override
    @Transactional(readOnly = true)
    public CartResponse getCart(Long userId) {
        String key = cartKey(userId);
        Map<String, Integer> entries = hashOps().entries(key);
        List<CartItemResponse> items = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;

        if (entries.isEmpty()) {
            return CartResponse.builder()
                    .items(items)
                    .totalAmount(total)
                    .build();
        }

        // Collect all product IDs
        List<Long> productIds = entries.keySet().stream()
                .map(Long::valueOf)
                .toList();

        // Batch load products and fetch join their images in 1 query
        List<Product> products = productRepository.findAllByIdsWithImages(productIds);
        Map<Long, Product> productMap = products.stream()
                .collect(Collectors.toMap(Product::getId, p -> p));

        for (Map.Entry<String, Integer> entry : entries.entrySet()) {
            Long productId = Long.valueOf(entry.getKey());
            Integer qty = entry.getValue();
            Product product = productMap.get(productId);

            if (product == null) {
                log.warn("Product with id {} not found while building cart for user {}", productId, userId);
                continue;
            }

            BigDecimal subtotal = product.getPrice().multiply(BigDecimal.valueOf(qty));
            CartItemResponse item = CartItemResponse.builder()
                    .productId(productId)
                    .productName(product.getName())
                    .price(product.getPrice())
                    .thumbnailUrl(product.getImages().isEmpty() ? null : product.getImages().get(0).getImageUrl())
                    .quantity(qty)
                    .subtotal(subtotal)
                    .build();
            items.add(item);
            total = total.add(subtotal);
        }

        return CartResponse.builder()
                .items(items)
                .totalAmount(total)
                .build();
    }
}
