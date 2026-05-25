package com._eleven.shop.service.order;

import com._eleven.shop.common.constant.MessageConstants;
import com._eleven.shop.dto.cart.CartItemResponse;
import com._eleven.shop.dto.cart.CartResponse;
import com._eleven.shop.dto.order.OrderItemResponse;
import com._eleven.shop.dto.order.OrderRequest;
import com._eleven.shop.dto.order.OrderResponse;
import com._eleven.shop.entity.*;
import com._eleven.shop.exception.InsufficientStockException;
import com._eleven.shop.exception.ResourceNotFoundException;
import com._eleven.shop.repository.order.OrderItemRepository;
import com._eleven.shop.repository.order.OrderRepository;
import com._eleven.shop.repository.product.ProductRepository;
import com._eleven.shop.common.cache.CacheEvictionService;
import com._eleven.shop.repository.user.UserRepository;
import com._eleven.shop.service.cart.CartService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

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
    private final CacheEvictionService cacheEvictionService;
    private final SecureRandom secureRandom = new SecureRandom();

    @Override
    @Transactional
    public OrderResponse createOrder(Long userId, OrderRequest request) {
        // 1. Get user cart
        CartResponse cart = cartService.getCart(userId);
        
        // Validate cart is not empty first
        if (cart == null || cart.getItems() == null || cart.getItems().isEmpty()) {
            throw new IllegalArgumentException(MessageConstants.CART_EMPTY);
        }

        // 2. Fetch User (runs before stock check to align with test assertions order)
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(MessageConstants.USER_NOT_FOUND));

        // Validate stock
        validateStockOnly(cart);

        // 3. Build Order
        Order order = buildOrder(user, cart, request);

        // 4. Create Order Items and deduct stock
        List<OrderItem> orderItems = createOrderItems(order, cart);
        order.setItems(orderItems);

        // 5. Persist Order
        Order savedOrder = orderRepository.save(order);

        // 6. Clear Cart after commit
        clearCartAfterCommit(userId);

        log.info("Successfully created order with code {} for user {}", savedOrder.getOrderCode(), userId);
        cacheEvictionService.evictAfterCommit(
                "revenueStats", "orderStats", "topProductsMonth",
                "categoryRevenue"
        );
        return mapToOrderResponse(savedOrder);
    }

    private void validateStockOnly(CartResponse cart) {
        for (CartItemResponse cartItem : cart.getItems()) {
            Product product = productRepository.findById(cartItem.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException(MessageConstants.PRODUCT_NOT_FOUND));

            if (product.getStockQuantity() < cartItem.getQuantity()) {
                throw new InsufficientStockException(MessageConstants.INSUFFICIENT_STOCK + product.getName());
            }
        }
    }

    private void validateCartAndStock(CartResponse cart) {
        if (cart == null || cart.getItems() == null || cart.getItems().isEmpty()) {
            throw new IllegalArgumentException(MessageConstants.CART_EMPTY);
        }
        validateStockOnly(cart);
    }

    private Order buildOrder(User user, CartResponse cart, OrderRequest request) {
        return Order.builder()
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
    }

    private List<OrderItem> createOrderItems(Order order, CartResponse cart) {
        List<OrderItem> orderItems = new ArrayList<>();
        for (CartItemResponse cartItem : cart.getItems()) {
            Product product = productRepository.findById(cartItem.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException(MessageConstants.PRODUCT_NOT_FOUND));

            if (product.getStockQuantity() < cartItem.getQuantity()) {
                throw new InsufficientStockException(MessageConstants.INSUFFICIENT_STOCK + product.getName());
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
        return orderItems;
    }

    private void clearCartAfterCommit(Long userId) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    cartService.clearCart(userId);
                    log.info("Redis cart cleared after successful transaction commit for user {}", userId);
                }
            });
        } else {
            cartService.clearCart(userId);
        }
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
                .orElseThrow(() -> new ResourceNotFoundException(MessageConstants.ORDER_NOT_FOUND));

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
                .orElseThrow(() -> new ResourceNotFoundException(MessageConstants.ORDER_NOT_FOUND));

        if (!order.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Unauthorized to cancel this order");
        }

        if (order.getStatus() != OrderStatus.PENDING) {
            throw new IllegalArgumentException(MessageConstants.ONLY_PENDING_CAN_CANCEL);
        }

        // Return stock quantities
        for (OrderItem item : order.getItems()) {
            Product product = productRepository.findById(item.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException(MessageConstants.PRODUCT_NOT_FOUND));
            product.setStockQuantity(product.getStockQuantity() + item.getQuantity());
            productRepository.save(product);
        }

        order.setStatus(OrderStatus.CANCELLED);
        order.setPaymentStatus(PaymentStatus.CANCELLED);
        orderRepository.save(order);
        log.info("Order with ID {} was cancelled by user {}", orderId, userId);
        cacheEvictionService.evictAfterCommit(
                "revenueStats", "orderStats", "topProductsMonth",
                "categoryRevenue"
        );
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OrderResponse> getAllOrders(OrderStatus status, Long userId, Pageable pageable) {
        Page<Order> orders;
        if (userId != null && status != null) {
            orders = orderRepository.findByUserIdAndStatus(userId, status, pageable);
        } else if (userId != null) {
            orders = orderRepository.findByUserId(userId, pageable);
        } else if (status != null) {
            orders = orderRepository.findByStatus(status, pageable);
        } else {
            orders = orderRepository.findAll(pageable);
        }
        return orders.map(this::mapToOrderResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getOrderById(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException(MessageConstants.ORDER_NOT_FOUND));
        return mapToOrderResponse(order);
    }

    @Override
    @Transactional
    public OrderResponse updateOrderStatus(Long orderId, OrderStatus newStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException(MessageConstants.ORDER_NOT_FOUND));

        OrderStatus currentStatus = order.getStatus();
        if (!currentStatus.isValidTransitionTo(newStatus)) {
            throw new IllegalArgumentException(MessageConstants.INVALID_STATUS_TRANSITION);
        }

        order.setStatus(newStatus);

        if (newStatus == OrderStatus.DELIVERED) {
            order.setPaymentStatus(PaymentStatus.PAID);
        } else if (newStatus == OrderStatus.CANCELLED) {
            order.setPaymentStatus(PaymentStatus.CANCELLED);

            // Revert stock quantities
            for (OrderItem item : order.getItems()) {
                Product product = productRepository.findById(item.getProductId())
                        .orElseThrow(() -> new ResourceNotFoundException(MessageConstants.PRODUCT_NOT_FOUND));
                product.setStockQuantity(product.getStockQuantity() + item.getQuantity());
                productRepository.save(product);
            }
        }

        Order updatedOrder = orderRepository.save(order);
        log.info("Order status with ID {} updated from {} to {}", orderId, currentStatus, newStatus);
        cacheEvictionService.evictAfterCommit(
                "revenueStats", "orderStats", "topProductsMonth",
                "categoryRevenue"
        );
        return mapToOrderResponse(updatedOrder);
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
