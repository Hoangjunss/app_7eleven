package com._eleven.shop.security;

import com._eleven.shop.aspect.AuditLogAspect;
import com._eleven.shop.controller.category.CategoryController;
import com._eleven.shop.controller.product.ProductController;
import com._eleven.shop.controller.admin.AdminCategoryController;
import com._eleven.shop.controller.admin.AdminProductController;
import com._eleven.shop.dto.category.CategoryRequest;
import com._eleven.shop.dto.category.CategoryResponse;
import com._eleven.shop.dto.product.ProductRequest;
import com._eleven.shop.dto.product.ProductResponse;
import com._eleven.shop.entity.Role;
import com._eleven.shop.entity.User;
import com._eleven.shop.repository.audit.AuditLogRepository;
import com._eleven.shop.repository.user.RoleRepository;
import com._eleven.shop.repository.user.UserRepository;
import com._eleven.shop.service.audit.AuditLogService;
import com._eleven.shop.service.category.CategoryService;
import com._eleven.shop.service.product.ProductService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.EnableAspectJAutoProxy;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = {
        CategoryController.class,
        AdminCategoryController.class,
        ProductController.class,
        AdminProductController.class
})
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, AuditLogAspect.class, AuditLogService.class})
@EnableAspectJAutoProxy
public class ProductCategorySecurityTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private CategoryService categoryService;

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
        // Setup mock user for JwtAuthenticationFilter
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

        // Mock some default service calls to avoid NullPointer if accessed
        Mockito.when(categoryService.getAllCategories()).thenReturn(Collections.emptyList());
        Mockito.when(categoryService.getCategoryById(1L)).thenReturn(CategoryResponse.builder().id(1L).name("Mock Category").build());

        Page<ProductResponse> emptyPage = new PageImpl<>(Collections.emptyList());
        Mockito.when(productService.getAllProducts(any(), any(), any(), any(), any(Pageable.class))).thenReturn(emptyPage);
        Mockito.when(productService.getProductById(1L)).thenReturn(ProductResponse.builder().id(1L).name("Mock Product").price(BigDecimal.TEN).build());
    }

    // =========================================================================
    // Category APIs Authorization Tests
    // =========================================================================

    @Test
    void testPublicGetCategoriesAllowed() throws Exception {
        mockMvc.perform(get("/api/v1/categories"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/categories/1"))
                .andExpect(status().isOk());
    }

    @Test
    void testAdminCategoriesWithoutAuthIsUnauthorized() throws Exception {
        CategoryRequest request = CategoryRequest.builder().name("New Category").build();

        mockMvc.perform(post("/api/v1/admin/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(put("/api/v1/admin/categories/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(delete("/api/v1/admin/categories/1"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "user@test.com", roles = "USER")
    void testAdminCategoriesWithUserRoleIsForbidden() throws Exception {
        CategoryRequest request = CategoryRequest.builder().name("New Category").build();

        mockMvc.perform(post("/api/v1/admin/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());

        mockMvc.perform(put("/api/v1/admin/categories/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());

        mockMvc.perform(delete("/api/v1/admin/categories/1"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "admin@test.com", roles = "ADMIN")
    void testAdminCategoriesWithAdminRoleIsAllowed() throws Exception {
        CategoryRequest request = CategoryRequest.builder().name("New Category").build();
        Mockito.when(categoryService.createCategory(any(CategoryRequest.class)))
                .thenReturn(CategoryResponse.builder().id(1L).name("New Category").build());
        Mockito.when(categoryService.updateCategory(eq(1L), any(CategoryRequest.class)))
                .thenReturn(CategoryResponse.builder().id(1L).name("Updated Category").build());

        mockMvc.perform(post("/api/v1/admin/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        mockMvc.perform(put("/api/v1/admin/categories/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        mockMvc.perform(delete("/api/v1/admin/categories/1"))
                .andExpect(status().isOk());
    }

    // =========================================================================
    // Product APIs Authorization Tests
    // =========================================================================

    @Test
    void testPublicGetProductsAllowed() throws Exception {
        mockMvc.perform(get("/api/v1/products"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/products/1"))
                .andExpect(status().isOk());
    }

    @Test
    void testAdminProductsWithoutAuthIsUnauthorized() throws Exception {
        ProductRequest request = ProductRequest.builder().name("New Product").price(BigDecimal.TEN).stockQuantity(10).categoryId(1L).build();

        mockMvc.perform(post("/api/v1/admin/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(put("/api/v1/admin/products/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(delete("/api/v1/admin/products/1"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/v1/admin/products/1"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/v1/admin/products"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "user@test.com", roles = "USER")
    void testAdminProductsWithUserRoleIsForbidden() throws Exception {
        ProductRequest request = ProductRequest.builder().name("New Product").price(BigDecimal.TEN).stockQuantity(10).categoryId(1L).build();

        mockMvc.perform(post("/api/v1/admin/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());

        mockMvc.perform(put("/api/v1/admin/products/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());

        mockMvc.perform(delete("/api/v1/admin/products/1"))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/admin/products/1"))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/admin/products"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "admin@test.com", roles = "ADMIN")
    void testAdminProductsWithAdminRoleIsAllowed() throws Exception {
        ProductRequest request = ProductRequest.builder().name("New Product").price(BigDecimal.TEN).stockQuantity(10).categoryId(1L).build();
        Mockito.when(productService.createProduct(any(ProductRequest.class), any(), any()))
                .thenReturn(ProductResponse.builder().id(1L).name("New Product").price(BigDecimal.TEN).build());
        Mockito.when(productService.updateProduct(eq(1L), any(ProductRequest.class)))
                .thenReturn(ProductResponse.builder().id(1L).name("Updated Product").price(BigDecimal.TEN).build());

        mockMvc.perform(post("/api/v1/admin/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        mockMvc.perform(put("/api/v1/admin/products/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/admin/products/1"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/admin/products"))
                .andExpect(status().isOk());

        mockMvc.perform(delete("/api/v1/admin/products/1"))
                .andExpect(status().isOk());
    }
}
