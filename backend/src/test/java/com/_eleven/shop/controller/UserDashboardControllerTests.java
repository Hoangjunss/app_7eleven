package com._eleven.shop.controller;

import com._eleven.shop.aspect.AuditLogAspect;
import com._eleven.shop.dto.HotProductResponse;
import com._eleven.shop.dto.ProductResponse;
import com._eleven.shop.entity.Role;
import com._eleven.shop.entity.User;
import com._eleven.shop.mapper.ProductMapper;
import com._eleven.shop.repository.AuditLogRepository;
import com._eleven.shop.repository.ProductRepository;
import com._eleven.shop.repository.RoleRepository;
import com._eleven.shop.repository.UserRepository;
import com._eleven.shop.security.JwtAuthenticationFilter;
import com._eleven.shop.security.JwtProvider;
import com._eleven.shop.security.SecurityConfig;
import com._eleven.shop.service.AuditLogService;
import com._eleven.shop.service.DashboardService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.EnableAspectJAutoProxy;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;
import java.util.Optional;
import java.util.Set;

import static org.mockito.ArgumentMatchers.anyLong;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = {DashboardController.class})
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, AuditLogAspect.class, AuditLogService.class})
@EnableAspectJAutoProxy
public class UserDashboardControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private DashboardService dashboardService;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private RoleRepository roleRepository;

    @MockBean
    private ProductRepository productRepository;

    @MockBean
    private ProductMapper productMapper;

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
    }

    @Test
    @WithMockUser(username = "user@test.com", roles = "USER")
    void testGetHotThisMonth() throws Exception {
        Mockito.when(dashboardService.getTopProductsThisMonth())
                .thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/v1/dashboard/hot-this-month"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "user@test.com", roles = "USER")
    void testGetRecentOrders() throws Exception {
        Mockito.when(dashboardService.getRecentOrdersForUser(anyLong()))
                .thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/v1/dashboard/recent"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "user@test.com", roles = "USER")
    void testGetSuggestions() throws Exception {
        Mockito.when(dashboardService.getProductSuggestionsForUser(anyLong()))
                .thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/v1/dashboard/suggestions"))
                .andExpect(status().isOk());
    }
}
