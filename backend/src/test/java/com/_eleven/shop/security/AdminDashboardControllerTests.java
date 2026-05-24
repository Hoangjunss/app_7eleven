package com._eleven.shop.security;

import com._eleven.shop.controller.admin.AdminDashboardController;
import com._eleven.shop.dto.dashboard.DashboardKpiResponse;
import com._eleven.shop.dto.order.OrderResponse;
import com._eleven.shop.dto.dashboard.RevenueChartResponse;
import com._eleven.shop.dto.dashboard.TopProductResponse;
import com._eleven.shop.repository.audit.AuditLogRepository;
import com._eleven.shop.repository.user.RoleRepository;
import com._eleven.shop.repository.user.UserRepository;
import com._eleven.shop.service.audit.AuditLogService;
import com._eleven.shop.service.dashboard.DashboardService;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = AdminDashboardController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, AuditLogService.class})
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

    private final String startParam = "2026-05-01T00:00:00Z";
    private final String endParam = "2026-05-31T23:59:59Z";

    @Test
    void testDashboardEndpointsWithoutAuthIsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/admin/dashboard/kpi")
                        .param("startDate", startParam)
                        .param("endDate", endParam))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/v1/admin/dashboard/revenue")
                        .param("startDate", startParam)
                        .param("endDate", endParam))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/v1/admin/dashboard/top-products")
                        .param("startDate", startParam)
                        .param("endDate", endParam))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/v1/admin/dashboard/recent-orders"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "user@test.com", roles = "USER")
    void testDashboardEndpointsWithUserRoleIsForbidden() throws Exception {
        mockMvc.perform(get("/api/v1/admin/dashboard/kpi")
                        .param("startDate", startParam)
                        .param("endDate", endParam))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/admin/dashboard/revenue")
                        .param("startDate", startParam)
                        .param("endDate", endParam))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/admin/dashboard/top-products")
                        .param("startDate", startParam)
                        .param("endDate", endParam))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/admin/dashboard/recent-orders"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "admin@test.com", roles = "ADMIN")
    void testDashboardEndpointsWithAdminRoleIsAllowed() throws Exception {
        DashboardKpiResponse mockKpi = DashboardKpiResponse.builder()
                .totalRevenue(new BigDecimal("1000000"))
                .totalOrders(100)
                .totalProducts(50)
                .totalUsers(20)
                .orderCountByStatus(Collections.emptyMap())
                .build();

        List<RevenueChartResponse> mockRevenue = List.of(
                new RevenueChartResponse("2026-05-01", new BigDecimal("100000"), 10)
        );

        List<TopProductResponse> mockTopProducts = List.of(
                new TopProductResponse(1L, "Product X", 50, new BigDecimal("500000"))
        );

        List<OrderResponse> mockRecentOrders = List.of(
                OrderResponse.builder().id(1L).orderCode("ORD-123").totalAmount(new BigDecimal("50000")).status("PENDING").build()
        );

        Mockito.when(dashboardService.getKpi(any(OffsetDateTime.class), any(OffsetDateTime.class))).thenReturn(mockKpi);
        Mockito.when(dashboardService.getRevenueChart(any(OffsetDateTime.class), any(OffsetDateTime.class))).thenReturn(mockRevenue);
        Mockito.when(dashboardService.getTopProducts(any(OffsetDateTime.class), any(OffsetDateTime.class), eq(5))).thenReturn(mockTopProducts);
        Mockito.when(dashboardService.getRecentOrders(eq(5))).thenReturn(mockRecentOrders);

        mockMvc.perform(get("/api/v1/admin/dashboard/kpi")
                        .param("startDate", startParam)
                        .param("endDate", endParam)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.totalRevenue").value(1000000))
                .andExpect(jsonPath("$.data.totalOrders").value(100));

        mockMvc.perform(get("/api/v1/admin/dashboard/revenue")
                        .param("startDate", startParam)
                        .param("endDate", endParam)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data[0].date").value("2026-05-01"))
                .andExpect(jsonPath("$.data[0].revenue").value(100000));

        mockMvc.perform(get("/api/v1/admin/dashboard/top-products")
                        .param("startDate", startParam)
                        .param("endDate", endParam)
                        .param("limit", "5")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data[0].productName").value("Product X"))
                .andExpect(jsonPath("$.data[0].totalQuantitySold").value(50));

        mockMvc.perform(get("/api/v1/admin/dashboard/recent-orders")
                        .param("limit", "5")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data[0].orderCode").value("ORD-123"))
                .andExpect(jsonPath("$.data[0].status").value("PENDING"));
    }
}
