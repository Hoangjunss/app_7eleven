package com._eleven.shop.controller;

import com._eleven.shop.aspect.AuditLogAspect;
import com._eleven.shop.controller.admin.AdminDashboardController;
import com._eleven.shop.dto.common.*;
import com._eleven.shop.dto.auth.*;
import com._eleven.shop.dto.product.*;
import com._eleven.shop.dto.order.*;
import com._eleven.shop.dto.user.*;
import com._eleven.shop.dto.category.*;
import com._eleven.shop.dto.cart.*;
import com._eleven.shop.dto.dashboard.*;
import com._eleven.shop.entity.Role;
import com._eleven.shop.entity.User;
import com._eleven.shop.repository.audit.AuditLogRepository;
import com._eleven.shop.repository.user.RoleRepository;
import com._eleven.shop.repository.user.UserRepository;
import com._eleven.shop.security.JwtAuthenticationFilter;
import com._eleven.shop.security.JwtProvider;
import com._eleven.shop.security.SecurityConfig;
import com._eleven.shop.service.audit.AuditLogService;
import com._eleven.shop.service.dashboard.DashboardService;
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

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.Optional;
import java.util.Set;

import static org.mockito.ArgumentMatchers.any;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = {AdminDashboardController.class})
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, AuditLogAspect.class, AuditLogService.class})
@EnableAspectJAutoProxy
public class AdminDashboardControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private DashboardService dashboardService;

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
        User adminUser = User.builder()
                .id(2L)
                .email("admin@test.com")
                .roles(Set.of(Role.builder().name("ADMIN").build()))
                .build();
        Mockito.when(userRepository.findByEmail("admin@test.com")).thenReturn(Optional.of(adminUser));
    }

    @Test
    @WithMockUser(username = "admin@test.com", roles = "ADMIN")
    void testGetKpi() throws Exception {
        Mockito.when(dashboardService.getKpi(any(), any()))
                .thenReturn(DashboardKpiResponse.builder().totalRevenue(BigDecimal.TEN).build());

        mockMvc.perform(get("/api/v1/admin/dashboard/kpi")
                        .param("startDate", "2026-05-01T00:00:00Z")
                        .param("endDate", "2026-05-31T23:59:59Z"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "admin@test.com", roles = "ADMIN")
    void testGetRevenueStats() throws Exception {
        Mockito.when(dashboardService.getRevenueStats(any(), any()))
                .thenReturn(RevenueDashboardResponse.builder().totalRevenue(BigDecimal.TEN).build());

        mockMvc.perform(get("/api/v1/admin/dashboard/revenue-stats")
                        .param("startDate", "2026-05-01T00:00:00Z")
                        .param("endDate", "2026-05-31T23:59:59Z"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "admin@test.com", roles = "ADMIN")
    void testGetOrderStats() throws Exception {
        Mockito.when(dashboardService.getOrderStats(any(), any()))
                .thenReturn(OrderStatsResponse.builder().totalOrders(10).build());

        mockMvc.perform(get("/api/v1/admin/dashboard/order-stats")
                        .param("startDate", "2026-05-01T00:00:00Z")
                        .param("endDate", "2026-05-31T23:59:59Z"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "admin@test.com", roles = "ADMIN")
    void testGetLowStock() throws Exception {
        Mockito.when(dashboardService.getLowStockProducts())
                .thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/v1/admin/dashboard/low-stock"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "admin@test.com", roles = "ADMIN")
    void testGetNoOrders() throws Exception {
        Mockito.when(dashboardService.getNoOrderProducts30Days())
                .thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/v1/admin/dashboard/no-orders"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "admin@test.com", roles = "ADMIN")
    void testGetUserStats() throws Exception {
        Mockito.when(dashboardService.getUserStats(any(), any()))
                .thenReturn(UserStatsResponse.builder().totalUsers(10L).build());

        mockMvc.perform(get("/api/v1/admin/dashboard/user-stats")
                        .param("startDate", "2026-05-01T00:00:00Z")
                        .param("endDate", "2026-05-31T23:59:59Z"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "admin@test.com", roles = "ADMIN")
    void testGetCategoryRevenue() throws Exception {
        Mockito.when(dashboardService.getCategoryRevenues(any(), any()))
                .thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/v1/admin/dashboard/category-revenue")
                        .param("startDate", "2026-05-01T00:00:00Z")
                        .param("endDate", "2026-05-31T23:59:59Z"))
                .andExpect(status().isOk());
    }

    @Test
    void testGetDashboardEndpointsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/admin/dashboard/kpi"))
                .andExpect(status().isUnauthorized());
    }
}
