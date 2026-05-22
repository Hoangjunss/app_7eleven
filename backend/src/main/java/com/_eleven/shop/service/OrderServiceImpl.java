package com._eleven.shop.service;

import com._eleven.shop.dto.CartItemResponse;
import com._eleven.shop.dto.CartResponse;
import com._eleven.shop.dto.OrderItemResponse;
import com._eleven.shop.dto.OrderRequest;
import com._eleven.shop.dto.OrderResponse;
import com._eleven.shop.entity.*;
import com._eleven.shop.exception.InsufficientStockException;
import com._eleven.shop.repository.OrderItemRepository;
import com._eleven.shop.repository.OrderRepository;
import com._eleven.shop.repository.ProductRepository;
import com._eleven.shop.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final CartService cartService;
    private final SecureRandom secureRandom = new SecureRandom();

    @Override
    @Transactional
    public OrderResponse createOrder(Long userId, OrderRequest request) {
        // 1. Get user cart
        CartResponse cart = cartService.getCart(userId);
        if (cart == null || cart.getItems() == null || cart.getItems().isEmpty()) {
            throw new IllegalArgumentException("Cart is empty");
        }

        // 2. Fetch User
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // 3. Create Order Object
        Order order = Order.builder()
                .orderCode(generateOrderCode())
                .user(user)
                .status(OrderStatus.PENDING)
                .paymentMethod("COD")
                .paymentStatus(PaymentStatus.PENDING)
                .totalAmount(cart.getTotalAmount())
                .recipientName(request.getRecipientName())
                .recipientPhone(request.getRecipientPhone())
                .deliveryAddress(request.getDeliveryAddress())
                .note(request.getNote())
                .build();

        List<OrderItem> orderItems = new ArrayList<>();

        // 4. Process each cart item, check stock, and deduct
        for (CartItemResponse cartItem : cart.getItems()) {
            Product product = productRepository.findById(cartItem.getProductId())
                    .orElseThrow(() -> new IllegalArgumentException("Product with ID " + cartItem.getProductId() + " not found"));

            if (product.getStockQuantity() < cartItem.getQuantity()) {
                throw new InsufficientStockException("Insufficient stock for product: " + product.getName() + 
                        " (Available: " + product.getStockQuantity() + ", Requested: " + cartItem.getQuantity() + ")");
            }

            // Deduct stock (optimistic locking will trigger via @Version on save if conflict occurs)
            product.setStockQuantity(product.getStockQuantity() - cartItem.getQuantity());
            productRepository.save(product);

            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .productId(product.getId())
                    .productNameSnapshot(product.getName())
                    .priceSnapshot(product.getPrice())
                    .quantity(cartItem.getQuantity())
                    .subtotal(cartItem.getPrice().multiply(BigDecimal.valueOf(cartItem.getQuantity())))
                    .build();

            orderItems.add(orderItem);
        }

        order.setItems(orderItems);

        // 5. Persist Order (cascade will save order items)
        Order savedOrder = orderRepository.save(order);

        // 6. Clear Redis Cart
        cartService.clearCart(userId);

        log.info("Successfully created order with code {} for user {}", savedOrder.getOrderCode(), userId);
        return mapToOrderResponse(savedOrder);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OrderResponse> getOrdersForUser(Long userId, OrderStatus status, Pageable pageable) {
        Page<Order> orders;
        if (status == null) {
            orders = orderRepository.findByUserId(userId, pageable);
        } else {
            orders = orderRepository.findByUserIdAndStatus(userId, status, pageable);
        }
        return orders.map(this::mapToOrderResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getOrderDetails(Long userId, Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ADMIN"));

        if (!order.getUser().getId().equals(userId) && !isAdmin) {
            throw new IllegalArgumentException("Unauthorized to access this order");
        }

        return mapToOrderResponse(order);
    }

    @Override
    @Transactional
    public void cancelOrder(Long userId, Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        if (!order.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Unauthorized to cancel this order");
        }

        if (order.getStatus() != OrderStatus.PENDING) {
            throw new IllegalArgumentException("Only pending orders can be cancelled");
        }

        // Return stock quantities
        for (OrderItem item : order.getItems()) {
            Product product = productRepository.findById(item.getProductId())
                    .orElseThrow(() -> new IllegalArgumentException("Product not found for reverting stock"));
            product.setStockQuantity(product.getStockQuantity() + item.getQuantity());
            productRepository.save(product);
        }

        order.setStatus(OrderStatus.CANCELLED);
        order.setPaymentStatus(PaymentStatus.CANCELLED);
        orderRepository.save(order);
        log.info("Order with ID {} was cancelled by user {}", orderId, userId);
    }

    private String generateOrderCode() {
        String datePart = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        int randomPart = secureRandom.nextInt(9000) + 1000;
        String code = "ORD-" + datePart + "-" + randomPart;
        while (orderRepository.findByOrderCode(code).isPresent()) {
            randomPart = secureRandom.nextInt(9000) + 1000;
            code = "ORD-" + datePart + "-" + randomPart;
        }
        return code;
    }

    private OrderResponse mapToOrderResponse(Order order) {
        List<OrderItemResponse> itemResponses = order.getItems().stream()
                .map(item -> OrderItemResponse.builder()
                        .id(item.getId())
                        .productId(item.getProductId())
                        .productNameSnapshot(item.getProductNameSnapshot())
                        .priceSnapshot(item.getPriceSnapshot())
                        .quantity(item.getQuantity())
                        .subtotal(item.getSubtotal())
                        .build())
                .toList();

        return OrderResponse.builder()
                .id(order.getId())
                .orderCode(order.getOrderCode())
                .userId(order.getUser().getId())
                .status(order.getStatus().name())
                .paymentMethod(order.getPaymentMethod())
                .paymentStatus(order.getPaymentStatus().name())
                .totalAmount(order.getTotalAmount())
                .recipientName(order.getRecipientName())
                .recipientPhone(order.getRecipientPhone())
                .deliveryAddress(order.getDeliveryAddress())
                .note(order.getNote())
                .items(itemResponses)
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }
}
