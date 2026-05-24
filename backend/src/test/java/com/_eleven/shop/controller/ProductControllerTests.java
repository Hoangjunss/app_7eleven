package com._eleven.shop.controller;

import com._eleven.shop.aspect.AuditLogAspect;
import com._eleven.shop.controller.admin.AdminProductController;
import com._eleven.shop.dto.ProductRequest;
import com._eleven.shop.dto.ProductResponse;
import com._eleven.shop.entity.Role;
import com._eleven.shop.entity.User;
import com._eleven.shop.exception.ResourceNotFoundException;
import com._eleven.shop.repository.AuditLogRepository;
import com._eleven.shop.repository.RoleRepository;
import com._eleven.shop.repository.UserRepository;
import com._eleven.shop.security.JwtAuthenticationFilter;
import com._eleven.shop.security.JwtProvider;
import com._eleven.shop.security.SecurityConfig;
import com._eleven.shop.service.AuditLogService;
import com._eleven.shop.service.ProductService;
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

import java.math.BigDecimal;
import java.util.Collections;
import java.util.Optional;
import java.util.Set;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = {ProductController.class, AdminProductController.class})
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, AuditLogAspect.class, AuditLogService.class})
@EnableAspectJAutoProxy
public class ProductControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ProductService productService;

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
                .email("user@test.com")
                .roles(Set.of(Role.builder().name("USER").build()))
                .build();
        Mockito.when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(dummyUser));

        User adminUser = User.builder()
                .id(2L)
                .email("admin@test.com")
                .roles(Set.of(Role.builder().name("ADMIN").build()))
                .build();
        Mockito.when(userRepository.findByEmail("admin@test.com")).thenReturn(Optional.of(adminUser));
    }

    @Test
    void testGetProductsList() throws Exception {
        Mockito.when(productService.getAllProducts(any(), any(), any(), any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(Collections.emptyList()));

        mockMvc.perform(get("/api/v1/products"))
                .andExpect(status().isOk());
    }

    @Test
    void testGetProductByIdExists() throws Exception {
        ProductResponse response = ProductResponse.builder().id(1L).name("P1").build();
        Mockito.when(productService.getProductById(1L)).thenReturn(response);

        mockMvc.perform(get("/api/v1/products/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(1L))
                .andExpect(jsonPath("$.data.name").value("P1"));
    }

    @Test
    void testGetProductByIdNotFound() throws Exception {
        Mockito.when(productService.getProductById(99L))
                .thenThrow(new ResourceNotFoundException("Product not found"));

        mockMvc.perform(get("/api/v1/products/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Product not found"));
    }

    @Test
    @WithMockUser(username = "admin@test.com", roles = "ADMIN")
    void testCreateProductAdminRole() throws Exception {
        ProductRequest request = ProductRequest.builder()
                .name("New Prod")
                .price(BigDecimal.valueOf(10))
                .stockQuantity(5)
                .categoryId(1L)
                .build();

        ProductResponse response = ProductResponse.builder().id(1L).name("New Prod").build();
        Mockito.when(productService.createProduct(any(ProductRequest.class), any(), any())).thenReturn(response);

        mockMvc.perform(post("/api/v1/admin/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.name").value("New Prod"));
    }

    @Test
    @WithMockUser(username = "user@test.com", roles = "USER")
    void testCreateProductUserRoleIsForbidden() throws Exception {
        ProductRequest request = ProductRequest.builder().name("Forbidden").price(BigDecimal.TEN).stockQuantity(5).categoryId(1L).build();

        mockMvc.perform(post("/api/v1/admin/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "admin@test.com", roles = "ADMIN")
    void testCreateProductMissingFields() throws Exception {
        ProductRequest request = ProductRequest.builder()
                .name("") // blank name
                .build();

        mockMvc.perform(post("/api/v1/admin/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "admin@test.com", roles = "ADMIN")
    void testUpdateProductDuplicateName() throws Exception {
        ProductRequest request = ProductRequest.builder()
                .name("Duplicate")
                .price(BigDecimal.TEN)
                .stockQuantity(10)
                .categoryId(1L)
                .build();

        Mockito.when(productService.updateProduct(eq(1L), any(ProductRequest.class)))
                .thenThrow(new IllegalArgumentException("Product name already exists"));

        mockMvc.perform(put("/api/v1/admin/products/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Product name already exists"));
    }

    @Test
    void testGetProductsFilterMinPrice() throws Exception {
        Mockito.when(productService.getAllProducts(any(), any(), eq(BigDecimal.valueOf(50)), any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(Collections.emptyList()));

        mockMvc.perform(get("/api/v1/products").param("minPrice", "50"))
                .andExpect(status().isOk());
    }

    @Test
    void testGetProductsFilterMaxPrice() throws Exception {
        Mockito.when(productService.getAllProducts(any(), any(), any(), eq(BigDecimal.valueOf(100)), any(Pageable.class)))
                .thenReturn(new PageImpl<>(Collections.emptyList()));

        mockMvc.perform(get("/api/v1/products").param("maxPrice", "100"))
                .andExpect(status().isOk());
    }

    @Test
    void testGetProductsFilterBothPrices() throws Exception {
        Mockito.when(productService.getAllProducts(any(), any(), eq(BigDecimal.valueOf(50)), eq(BigDecimal.valueOf(100)), any(Pageable.class)))
                .thenReturn(new PageImpl<>(Collections.emptyList()));

        mockMvc.perform(get("/api/v1/products")
                        .param("minPrice", "50")
                        .param("maxPrice", "100"))
                .andExpect(status().isOk());
    }
}
