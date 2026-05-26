package com._eleven.shop.controller;
import com._eleven.shop.controller.order.OrderController;

import com._eleven.shop.aspect.AuditLogAspect;
import com._eleven.shop.controller.admin.AdminOrderController;
import com._eleven.shop.dto.order.OrderRequest;
import com._eleven.shop.dto.order.OrderResponse;
import com._eleven.shop.entity.OrderStatus;
import com._eleven.shop.entity.Role;
import com._eleven.shop.entity.User;
import com._eleven.shop.exception.InsufficientStockException;
import com._eleven.shop.exception.ResourceNotFoundException;
import com._eleven.shop.repository.audit.AuditLogRepository;
import com._eleven.shop.repository.user.RoleRepository;
import com._eleven.shop.repository.user.UserRepository;
import com._eleven.shop.security.JwtAuthenticationFilter;
import com._eleven.shop.security.JwtProvider;
import com._eleven.shop.security.SecurityConfig;
import com._eleven.shop.service.audit.AuditLogService;
import com._eleven.shop.service.order.OrderService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.EnableAspectJAutoProxy;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;
import java.util.Optional;
import java.util.Set;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = {OrderController.class, AdminOrderController.class})
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, AuditLogAspect.class, AuditLogService.class})
@EnableAspectJAutoProxy
public class OrderControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private OrderService orderService;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private RoleRepository roleRepository;

    @MockBean
    private AuditLogRepository auditLogRepository;

    @MockBean
    private JwtProvider jwtProvider;

    @BeforeEach
    void setUp() {
        User dummyUser = User.builder()
                .id(1L)
                .email("buyer@test.com")
                .roles(Set.of(Role.builder().name("USER").build()))
                .build();
        Mockito.when(userRepository.findByEmail("buyer@test.com")).thenReturn(Optional.of(dummyUser));

        User adminUser = User.builder()
                .id(2L)
                .email("admin@test.com")
                .roles(Set.of(Role.builder().name("ADMIN").build()))
                .build();
        Mockito.when(userRepository.findByEmail("admin@test.com")).thenReturn(Optional.of(adminUser));
    }

    @Test
    @WithMockUser(username = "buyer@test.com", roles = "USER")
    void testCreateOrderSuccess() throws Exception {
        OrderRequest request = OrderRequest.builder()
                .recipientName("Recipient")
                .recipientPhone("0987654321")
                .deliveryAddress("123 Main Street")
                .build();

        OrderResponse response = OrderResponse.builder().id(10L).orderCode("ORD-10").build();
        Mockito.when(orderService.createOrder(eq(1L), any(OrderRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.orderCode").value("ORD-10"));
    }

    @Test
    @WithMockUser(username = "buyer@test.com", roles = "USER")
    void testCreateOrderCartEmpty() throws Exception {
        OrderRequest request = OrderRequest.builder()
                .recipientName("Recipient")
                .recipientPhone("0987654321")
                .deliveryAddress("123 Main Street")
                .build();

        Mockito.when(orderService.createOrder(eq(1L), any(OrderRequest.class)))
                .thenThrow(new IllegalArgumentException("Cart is empty, cannot create order"));

        mockMvc.perform(post("/api/v1/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Cart is empty, cannot create order"));
    }

    @Test
    void testCreateOrderUnauthenticated() throws Exception {
        OrderRequest request = OrderRequest.builder().build();

        mockMvc.perform(post("/api/v1/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "buyer@test.com", roles = "USER")
    void testCreateOrderInsufficientStock() throws Exception {
        OrderRequest request = OrderRequest.builder()
                .recipientName("Recipient")
                .recipientPhone("0987654321")
                .deliveryAddress("123 Main Street")
                .build();

        Mockito.when(orderService.createOrder(eq(1L), any(OrderRequest.class)))
                .thenThrow(new InsufficientStockException("Insufficient stock for product: Apples"));

        mockMvc.perform(post("/api/v1/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnprocessableEntity()) // 422 is returned for InsufficientStockException
                .andExpect(jsonPath("$.message").value("Insufficient stock for product: Apples"));
    }

    @Test
    @WithMockUser(username = "admin@test.com", roles = "ADMIN")
    void testGetOrdersAdminRole() throws Exception {
        Mockito.when(orderService.getAllOrders(any(), any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(Collections.emptyList()));

        mockMvc.perform(get("/api/v1/admin/orders"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "buyer@test.com", roles = "USER")
    void testGetOrdersUserRoleIsForbidden() throws Exception {
        mockMvc.perform(get("/api/v1/admin/orders"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "admin@test.com", roles = "ADMIN")
    void testGetOrdersSortedAsc() throws Exception {
        Mockito.when(orderService.getAllOrders(any(), any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(Collections.emptyList()));

        mockMvc.perform(get("/api/v1/admin/orders")
                        .param("sortBy", "createdAt")
                        .param("direction", "asc"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "admin@test.com", roles = "ADMIN")
    void testGetOrdersSortedDesc() throws Exception {
        Mockito.when(orderService.getAllOrders(any(), any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(Collections.emptyList()));

        mockMvc.perform(get("/api/v1/admin/orders")
                        .param("sortBy", "createdAt")
                        .param("direction", "desc"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "admin@test.com", roles = "ADMIN")
    void testUpdateOrderStatusValidTransition() throws Exception {
        OrderResponse response = OrderResponse.builder().id(1L).status("CONFIRMED").build();
        Mockito.when(orderService.updateOrderStatus(1L, OrderStatus.CONFIRMED)).thenReturn(response);

        mockMvc.perform(put("/api/v1/admin/orders/1/status")
                        .param("status", "CONFIRMED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("CONFIRMED"));
    }

    @Test
    @WithMockUser(username = "admin@test.com", roles = "ADMIN")
    void testUpdateOrderStatusInvalidTransition() throws Exception {
        Mockito.when(orderService.updateOrderStatus(1L, OrderStatus.DELIVERED))
                .thenThrow(new IllegalArgumentException("Invalid order status transition"));

        mockMvc.perform(put("/api/v1/admin/orders/1/status")
                        .param("status", "DELIVERED"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invalid order status transition"));
    }

    @Test
    @WithMockUser(username = "admin@test.com", roles = "ADMIN")
    void testGetOrderByIdNotFound() throws Exception {
        Mockito.when(orderService.getOrderById(99L))
                .thenThrow(new ResourceNotFoundException("Order not found"));

        mockMvc.perform(get("/api/v1/admin/orders/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Order not found"));
    }
}
