package com._eleven.shop.service;

import com._eleven.shop.dto.*;
import com._eleven.shop.entity.*;
import com._eleven.shop.exception.InsufficientStockException;
import com._eleven.shop.exception.ResourceNotFoundException;
import com._eleven.shop.repository.OrderRepository;
import com._eleven.shop.repository.ProductRepository;
import com._eleven.shop.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class OrderServiceTests {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private CartService cartService;

    @InjectMocks
    private OrderServiceImpl orderService;

    @Test
    void testCreateOrderSuccess() {
        Long userId = 1L;
        Long productId = 100L;

        CartItemResponse cartItem = CartItemResponse.builder()
                .productId(productId)
                .productName("Item A")
                .price(BigDecimal.valueOf(10))
                .quantity(2)
                .build();
        CartResponse cartResponse = CartResponse.builder()
                .items(List.of(cartItem))
                .totalAmount(BigDecimal.valueOf(20))
                .build();

        User user = User.builder().id(userId).email("user@test.com").build();
        Product product = Product.builder()
                .id(productId)
                .name("Item A")
                .price(BigDecimal.valueOf(10))
                .stockQuantity(10)
                .build();

        when(cartService.getCart(userId)).thenReturn(cartResponse);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
            Order o = invocation.getArgument(0);
            o.setId(99L);
            return o;
        });

        OrderRequest request = OrderRequest.builder()
                .recipientName("Recipient")
                .recipientPhone("123456")
                .deliveryAddress("Address")
                .build();

        OrderResponse response = orderService.createOrder(userId, request);

        assertNotNull(response);
        assertEquals(99L, response.getId());
        assertEquals(8, product.getStockQuantity()); // 10 - 2
        verify(productRepository).save(product);
        verify(cartService).clearCart(userId);
    }

    @Test
    void testCreateOrderEmptyCartThrowsException() {
        Long userId = 1L;
        when(cartService.getCart(userId)).thenReturn(CartResponse.builder().items(Collections.emptyList()).build());

        OrderRequest request = OrderRequest.builder().build();

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            orderService.createOrder(userId, request);
        });

        assertEquals("Cart is empty, cannot create order", exception.getMessage());
    }

    @Test
    void testCreateOrderUserNotFoundThrowsException() {
        Long userId = 1L;
        CartItemResponse cartItem = CartItemResponse.builder().productId(100L).quantity(1).build();
        CartResponse cartResponse = CartResponse.builder().items(List.of(cartItem)).build();

        when(cartService.getCart(userId)).thenReturn(cartResponse);
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        OrderRequest request = OrderRequest.builder().build();

        assertThrows(ResourceNotFoundException.class, () -> {
            orderService.createOrder(userId, request);
        });
    }

    @Test
    void testCreateOrderProductNotFoundThrowsException() {
        Long userId = 1L;
        Long productId = 100L;
        CartItemResponse cartItem = CartItemResponse.builder().productId(productId).quantity(1).build();
        CartResponse cartResponse = CartResponse.builder().items(List.of(cartItem)).build();

        User user = User.builder().id(userId).build();

        when(cartService.getCart(userId)).thenReturn(cartResponse);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(productRepository.findById(productId)).thenReturn(Optional.empty());

        OrderRequest request = OrderRequest.builder().build();

        assertThrows(ResourceNotFoundException.class, () -> {
            orderService.createOrder(userId, request);
        });
    }

    @Test
    void testCreateOrderInsufficientStockThrowsException() {
        Long userId = 1L;
        Long productId = 100L;
        CartItemResponse cartItem = CartItemResponse.builder()
                .productId(productId)
                .quantity(10)
                .build();
        CartResponse cartResponse = CartResponse.builder()
                .items(List.of(cartItem))
                .totalAmount(BigDecimal.valueOf(100))
                .build();

        User user = User.builder().id(userId).build();
        Product product = Product.builder()
                .id(productId)
                .name("Item A")
                .price(BigDecimal.valueOf(10))
                .stockQuantity(5) // only 5
                .build();

        when(cartService.getCart(userId)).thenReturn(cartResponse);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));

        OrderRequest request = OrderRequest.builder().build();

        InsufficientStockException exception = assertThrows(InsufficientStockException.class, () -> {
            orderService.createOrder(userId, request);
        });

        assertEquals("Insufficient stock for product: Item A", exception.getMessage());
    }

    @Test
    void testGetOrdersForUserSortingAsc() {
        Long userId = 1L;
        Pageable pageable = PageRequest.of(0, 10, Sort.by(Sort.Direction.ASC, "createdAt"));
        when(orderRepository.findByUserId(userId, pageable)).thenReturn(new PageImpl<>(Collections.emptyList()));

        orderService.getOrdersForUser(userId, null, pageable);

        verify(orderRepository).findByUserId(userId, pageable);
    }

    @Test
    void testGetOrdersForUserSortingDesc() {
        Long userId = 1L;
        Pageable pageable = PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "createdAt"));
        when(orderRepository.findByUserId(userId, pageable)).thenReturn(new PageImpl<>(Collections.emptyList()));

        orderService.getOrdersForUser(userId, null, pageable);

        verify(orderRepository).findByUserId(userId, pageable);
    }

    @Test
    void testUpdateOrderStatusValidTransition() {
        Long orderId = 1L;
        Order order = Order.builder()
                .id(orderId)
                .status(OrderStatus.PENDING)
                .paymentStatus(PaymentStatus.PENDING)
                .items(new ArrayList<>())
                .user(User.builder().id(10L).build())
                .build();

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(orderRepository.save(order)).thenReturn(order);

        orderService.updateOrderStatus(orderId, OrderStatus.CONFIRMED);

        assertEquals(OrderStatus.CONFIRMED, order.getStatus());
        verify(orderRepository).save(order);
    }

    @Test
    void testUpdateOrderStatusInvalidTransition() {
        Long orderId = 1L;
        Order order = Order.builder()
                .id(orderId)
                .status(OrderStatus.PENDING)
                .paymentStatus(PaymentStatus.PENDING)
                .build();

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            orderService.updateOrderStatus(orderId, OrderStatus.DELIVERED); // PENDING directly to DELIVERED is invalid
        });

        assertEquals("Invalid order status transition", exception.getMessage());
    }

    @Test
    void testOrderNotFoundThrowsException() {
        Long orderId = 99L;
        when(orderRepository.findById(orderId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> {
            orderService.getOrderById(orderId);
        });
    }
}
