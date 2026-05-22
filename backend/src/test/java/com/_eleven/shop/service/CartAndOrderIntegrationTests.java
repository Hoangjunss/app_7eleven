package com._eleven.shop.service;

import com._eleven.shop.dto.CartItemResponse;
import com._eleven.shop.dto.CartResponse;
import com._eleven.shop.dto.OrderRequest;
import com._eleven.shop.dto.OrderResponse;
import com._eleven.shop.entity.*;
import com._eleven.shop.exception.InsufficientStockException;
import com._eleven.shop.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.HashOperations;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.MediaType;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
@AutoConfigureMockMvc
public class CartAndOrderIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private OrderService orderService;

    @Autowired
    private CartService cartService;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private PlatformTransactionManager transactionManager;

    @Autowired
    private jakarta.persistence.EntityManager entityManager;

    @MockBean
    private CloudinaryStorageService cloudinaryStorageService;

    @MockBean
    private RedisTemplate<String, Object> redisTemplate;

    @SuppressWarnings("rawtypes")
    private HashOperations hashOps;
    private TransactionTemplate transactionTemplate;

    private Long userId;
    private Long product1Id;
    private Long product2Id;

    @BeforeEach
    void setUp() {
        transactionTemplate = new TransactionTemplate(transactionManager);

        transactionTemplate.execute(status -> {
            entityManager.createNativeQuery("DELETE FROM audit_logs").executeUpdate();
            entityManager.createNativeQuery("DELETE FROM order_items").executeUpdate();
            entityManager.createNativeQuery("DELETE FROM orders").executeUpdate();
            entityManager.createNativeQuery("DELETE FROM product_images").executeUpdate();
            entityManager.createNativeQuery("DELETE FROM products").executeUpdate();
            entityManager.createNativeQuery("DELETE FROM categories").executeUpdate();
            entityManager.createNativeQuery("DELETE FROM user_roles").executeUpdate();
            entityManager.createNativeQuery("DELETE FROM users").executeUpdate();
            entityManager.createNativeQuery("DELETE FROM roles").executeUpdate();

            Role userRole = Role.builder().name("USER").build();
            Role adminRole = Role.builder().name("ADMIN").build();
            roleRepository.saveAll(List.of(userRole, adminRole));

            User user = User.builder()
                    .email("buyer@test.com")
                    .password("password")
                    .fullName("Buyer User")
                    .roles(Set.of(userRole))
                    .build();
            
            User admin = User.builder()
                    .email("admin@test.com")
                    .password("password")
                    .fullName("Admin User")
                    .roles(Set.of(adminRole))
                    .build();

            userRepository.saveAll(List.of(user, admin));
            userId = user.getId();

            Category category = Category.builder()
                    .name("Groceries")
                    .build();
            Category savedCategory = categoryRepository.save(category);

            Product product1 = Product.builder()
                    .name("Apples")
                    .price(BigDecimal.valueOf(1.99))
                    .stockQuantity(100)
                    .category(savedCategory)
                    .build();

            Product product2 = Product.builder()
                    .name("Bananas")
                    .price(BigDecimal.valueOf(0.99))
                    .stockQuantity(50)
                    .category(savedCategory)
                    .build();

            productRepository.saveAll(List.of(product1, product2));
            product1Id = product1.getId();
            product2Id = product2.getId();

            return null;
        });

        hashOps = mock(HashOperations.class);
        when(redisTemplate.opsForHash()).thenReturn(hashOps);
    }

    // ==========================================
    // CART OPERATIONS INTEGRATION TESTS
    // ==========================================

    @Test
    void testCartOperations_AddItem() {
        cartService.addItemToCart(userId, product1Id, 5);
        verify(hashOps, times(1)).get("cart:" + userId, product1Id.toString());
        verify(hashOps, times(1)).put("cart:" + userId, product1Id.toString(), 5);
        verify(redisTemplate, times(1)).expire(eq("cart:" + userId), any(Duration.class));
    }

    @Test
    void testCartOperations_UpdateItem() {
        cartService.updateCartItem(userId, product1Id, 8);
        verify(hashOps, times(1)).put("cart:" + userId, product1Id.toString(), 8);

        cartService.updateCartItem(userId, product1Id, 0);
        verify(hashOps, times(1)).delete("cart:" + userId, product1Id.toString());
    }

    @Test
    void testCartOperations_RemoveItem() {
        cartService.removeCartItem(userId, product1Id);
        verify(hashOps, times(1)).delete("cart:" + userId, product1Id.toString());
    }

    @Test
    void testCartOperations_ClearCart() {
        cartService.clearCart(userId);
        verify(redisTemplate, times(1)).delete("cart:" + userId);
    }

    @Test
    void testCartOperations_GetCart() {
        Map<String, Integer> cartMap = new HashMap<>();
        cartMap.put(product1Id.toString(), 3);
        cartMap.put(product2Id.toString(), 2);
        when(hashOps.entries("cart:" + userId)).thenReturn(cartMap);

        CartResponse cart = cartService.getCart(userId);

        assertNotNull(cart);
        assertEquals(2, cart.getItems().size());
        
        // Product 1 subtotal: 1.99 * 3 = 5.97
        // Product 2 subtotal: 0.99 * 2 = 1.98
        // Total: 7.95
        assertEquals(0, BigDecimal.valueOf(7.95).compareTo(cart.getTotalAmount()));
    }

    // ==========================================
    // ORDER PROCESS INTEGRATION TESTS
    // ==========================================

    @Test
    void testCreateOrder_Success() {
        Map<String, Integer> cartMap = new HashMap<>();
        cartMap.put(product1Id.toString(), 2); // 2 apples
        when(hashOps.entries("cart:" + userId)).thenReturn(cartMap);

        OrderRequest request = OrderRequest.builder()
                .recipientName("Recipient Name")
                .recipientPhone("0987654321")
                .deliveryAddress("123 Street, District 1")
                .note("Please deliver in office hours")
                .build();

        OrderResponse order = orderService.createOrder(userId, request);

        assertNotNull(order);
        assertNotNull(order.getId());
        assertEquals("PENDING", order.getStatus());
        assertEquals("PENDING", order.getPaymentStatus());
        assertEquals(0, BigDecimal.valueOf(3.98).compareTo(order.getTotalAmount()));
        assertEquals(1, order.getItems().size());
        assertEquals("Apples", order.getItems().get(0).getProductNameSnapshot());

        // Verify stock deducted
        Product updatedProduct = productRepository.findById(product1Id).orElseThrow();
        assertEquals(98, updatedProduct.getStockQuantity());

        // Verify cart cleared
        verify(redisTemplate, times(1)).delete("cart:" + userId);
    }

    @Test
    void testCreateOrder_EmptyCart() {
        when(hashOps.entries("cart:" + userId)).thenReturn(Collections.emptyMap());

        OrderRequest request = OrderRequest.builder()
                .recipientName("Recipient")
                .recipientPhone("0987654321")
                .deliveryAddress("123 Street")
                .build();

        assertThrows(IllegalArgumentException.class, () -> orderService.createOrder(userId, request));
    }

    @Test
    void testCreateOrder_InsufficientStock() {
        Map<String, Integer> cartMap = new HashMap<>();
        cartMap.put(product1Id.toString(), 150); // only 100 available
        when(hashOps.entries("cart:" + userId)).thenReturn(cartMap);

        OrderRequest request = OrderRequest.builder()
                .recipientName("Recipient")
                .recipientPhone("0987654321")
                .deliveryAddress("123 Street")
                .build();

        assertThrows(InsufficientStockException.class, () -> orderService.createOrder(userId, request));

        // Verify stock is not deducted
        Product updatedProduct = productRepository.findById(product1Id).orElseThrow();
        assertEquals(100, updatedProduct.getStockQuantity());
    }

    @Test
    void testCancelOrder_Success() {
        // Create an order first
        Order order = transactionTemplate.execute(status -> {
            User user = userRepository.findById(userId).orElseThrow();
            Product p = productRepository.findById(product1Id).orElseThrow();
            p.setStockQuantity(95);
            productRepository.save(p);

            Order o = Order.builder()
                    .orderCode("ORDER123")
                    .user(user)
                    .status(OrderStatus.PENDING)
                    .paymentStatus(PaymentStatus.PENDING)
                    .totalAmount(BigDecimal.valueOf(9.95))
                    .recipientName("Recipient")
                    .recipientPhone("123")
                    .deliveryAddress("Addr")
                    .build();
            
            OrderItem item = OrderItem.builder()
                    .order(o)
                    .productId(p.getId())
                    .productNameSnapshot(p.getName())
                    .priceSnapshot(p.getPrice())
                    .quantity(5)
                    .subtotal(BigDecimal.valueOf(9.95))
                    .build();
            o.setItems(List.of(item));
            return orderRepository.save(o);
        });

        // Cancel the order
        orderService.cancelOrder(userId, order.getId());

        Order cancelledOrder = orderRepository.findById(order.getId()).orElseThrow();
        assertEquals(OrderStatus.CANCELLED, cancelledOrder.getStatus());
        assertEquals(PaymentStatus.CANCELLED, cancelledOrder.getPaymentStatus());

        // Verify stock returned (95 + 5 = 100)
        Product p = productRepository.findById(product1Id).orElseThrow();
        assertEquals(100, p.getStockQuantity());
    }

    @Test
    void testCancelOrder_InvalidStatus() {
        Order order = transactionTemplate.execute(status -> {
            User user = userRepository.findById(userId).orElseThrow();
            Order o = Order.builder()
                    .orderCode("ORDER123")
                    .user(user)
                    .status(OrderStatus.CONFIRMED) // already confirmed
                    .paymentStatus(PaymentStatus.PENDING)
                    .totalAmount(BigDecimal.valueOf(9.95))
                    .recipientName("Recipient")
                    .recipientPhone("123")
                    .deliveryAddress("Addr")
                    .build();
            return orderRepository.save(o);
        });

        assertThrows(IllegalArgumentException.class, () -> orderService.cancelOrder(userId, order.getId()));
    }

    // ==========================================
    // ADMIN APIs INTEGRATION TESTS
    // ==========================================

    @Test
    @WithMockUser(username = "admin@test.com", roles = "ADMIN")
    void testAdminGetOrders() throws Exception {
        transactionTemplate.execute(status -> {
            User user = userRepository.findById(userId).orElseThrow();
            Order o1 = Order.builder().orderCode("CODE1").user(user).status(OrderStatus.PENDING).paymentStatus(PaymentStatus.PENDING).totalAmount(BigDecimal.TEN).recipientName("R").recipientPhone("P").deliveryAddress("A").build();
            Order o2 = Order.builder().orderCode("CODE2").user(user).status(OrderStatus.CONFIRMED).paymentStatus(PaymentStatus.PENDING).totalAmount(BigDecimal.TEN).recipientName("R").recipientPhone("P").deliveryAddress("A").build();
            orderRepository.saveAll(List.of(o1, o2));
            return null;
        });

        mockMvc.perform(get("/api/v1/admin/orders")
                        .param("status", "CONFIRMED")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "admin@test.com", roles = "ADMIN")
    void testAdminUpdateOrderStatus_AndAuditLogs() throws Exception {
        Order order = transactionTemplate.execute(status -> {
            User user = userRepository.findById(userId).orElseThrow();
            Order o = Order.builder()
                    .orderCode("CODE3")
                    .user(user)
                    .status(OrderStatus.PENDING)
                    .paymentStatus(PaymentStatus.PENDING)
                    .totalAmount(BigDecimal.TEN)
                    .recipientName("R")
                    .recipientPhone("P")
                    .deliveryAddress("A")
                    .build();
            return orderRepository.save(o);
        });

        mockMvc.perform(patch("/api/v1/admin/orders/" + order.getId() + "/status")
                        .param("status", "CONFIRMED")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());

        Order updated = orderRepository.findById(order.getId()).orElseThrow();
        assertEquals(OrderStatus.CONFIRMED, updated.getStatus());

        // Verify Audit Log has been saved
        List<AuditLog> logs = auditLogRepository.findAll();
        assertFalse(logs.isEmpty());
        
        AuditLog matchingLog = logs.stream()
                .filter(log -> "UPDATE_ORDER_STATUS".equals(log.getAction()))
                .findFirst()
                .orElse(null);
        
        assertNotNull(matchingLog);
        assertEquals("ORDER", matchingLog.getEntityType());
        assertEquals("SUCCESS", matchingLog.getResult());
        assertEquals("admin@test.com", matchingLog.getActorEmail());
    }

    @Test
    @WithMockUser(username = "admin@test.com", roles = "ADMIN")
    void testAdminUpdateOrderStatus_InvalidTransition() throws Exception {
        Order order = transactionTemplate.execute(status -> {
            User user = userRepository.findById(userId).orElseThrow();
            Order o = Order.builder()
                    .orderCode("CODE4")
                    .user(user)
                    .status(OrderStatus.PENDING)
                    .paymentStatus(PaymentStatus.PENDING)
                    .totalAmount(BigDecimal.TEN)
                    .recipientName("R")
                    .recipientPhone("P")
                    .deliveryAddress("A")
                    .build();
            return orderRepository.save(o);
        });

        // PENDING -> DELIVERED directly is invalid transition
        mockMvc.perform(patch("/api/v1/admin/orders/" + order.getId() + "/status")
                        .param("status", "DELIVERED")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest());
    }

    // ==========================================
    // CONCURRENCY CHECKOUT (OPTIMISTIC LOCKING) TEST
    // ==========================================

    @Test
    void testConcurrencyCheckoutStockConflict() throws InterruptedException {
        // Set up product stock to exactly 1
        transactionTemplate.execute(status -> {
            Product p = productRepository.findById(product1Id).orElseThrow();
            p.setStockQuantity(1);
            productRepository.save(p);
            return null;
        });

        // Set up cart with 1 product
        Map<String, Integer> cartMap = new HashMap<>();
        cartMap.put(product1Id.toString(), 1);
        when(hashOps.entries("cart:" + userId)).thenReturn(cartMap);

        OrderRequest request = OrderRequest.builder()
                .recipientName("Recipient")
                .recipientPhone("0987654321")
                .deliveryAddress("123 Street")
                .build();

        int threadCount = 2;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch latch = new CountDownLatch(1);
        List<Future<OrderResponse>> futures = new ArrayList<>();

        for (int i = 0; i < threadCount; i++) {
            futures.add(executor.submit(() -> {
                latch.await(); // wait for start signal
                return orderService.createOrder(userId, request);
            }));
        }

        latch.countDown(); // Start concurrent execution

        int successCount = 0;
        int failureCount = 0;

        for (Future<OrderResponse> future : futures) {
            try {
                OrderResponse response = future.get();
                if (response != null) {
                    successCount++;
                }
            } catch (ExecutionException e) {
                Throwable cause = e.getCause();
                // Depending on which thread executes first, the second thread could either throw:
                // 1. ObjectOptimisticLockingFailureException (if conflict occurs during concurrent DB update of Product)
                // 2. InsufficientStockException (if it reads the updated stock after first thread saves)
                // 3. Or another IllegalArgumentException / RuntimeException
                assertTrue(cause instanceof ObjectOptimisticLockingFailureException 
                        || cause instanceof InsufficientStockException
                        || cause instanceof IllegalArgumentException);
                failureCount++;
            }
        }

        executor.shutdown();
        executor.awaitTermination(5, TimeUnit.SECONDS);

        // Verify that exactly 1 request succeeded and the other failed
        assertEquals(1, successCount);
        assertEquals(1, failureCount);

        // Verify final stock is 0
        Product finalProduct = productRepository.findById(product1Id).orElseThrow();
        assertEquals(0, finalProduct.getStockQuantity());
    }
}
