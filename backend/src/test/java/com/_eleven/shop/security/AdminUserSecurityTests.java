package com._eleven.shop.security;

import com._eleven.shop.aspect.AuditLogAspect;
import com._eleven.shop.controller.admin.AdminUserController;
import com._eleven.shop.dto.ApiResponse;
import com._eleven.shop.dto.UpdateRolesRequest;
import com._eleven.shop.dto.UserResponse;
import com._eleven.shop.entity.Role;
import com._eleven.shop.entity.User;
import com._eleven.shop.repository.AuditLogRepository;
import com._eleven.shop.repository.RoleRepository;
import com._eleven.shop.repository.UserRepository;
import com._eleven.shop.service.AuditLogService;
import com._eleven.shop.service.UserService;
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
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = {AdminUserController.class})
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, AuditLogAspect.class, AuditLogService.class})
@EnableAspectJAutoProxy
public class AdminUserSecurityTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserService userService;

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
    void testGetUsersWithoutAuth() throws Exception {
        mockMvc.perform(get("/api/v1/admin/users"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "user@test.com", roles = "USER")
    void testGetUsersWithUserRole() throws Exception {
        mockMvc.perform(get("/api/v1/admin/users"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "admin@test.com", roles = "ADMIN")
    void testGetUsersWithAdminRole() throws Exception {
        Mockito.when(userService.getAllUsers(anyString(), anyInt(), anyInt()))
                .thenReturn(new PageImpl<>(Collections.emptyList()));

        mockMvc.perform(get("/api/v1/admin/users"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "admin@test.com", roles = "ADMIN")
    void testUpdateRolesWithAdminRole() throws Exception {
        UpdateRolesRequest request = UpdateRolesRequest.builder()
                .roles(Set.of("ADMIN", "USER"))
                .build();

        Mockito.when(userService.updateRoles(eq(1L), any(UpdateRolesRequest.class)))
                .thenReturn(new UserResponse());

        mockMvc.perform(patch("/api/v1/admin/users/1/roles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "admin@test.com", roles = "ADMIN")
    void testLockUserWithAdminRole() throws Exception {
        Mockito.doNothing().when(userService).lockUser(1L);

        mockMvc.perform(delete("/api/v1/admin/users/1"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "admin@test.com", roles = "ADMIN")
    void testRestoreUserWithAdminRole() throws Exception {
        Mockito.doNothing().when(userService).restoreUser(1L);

        mockMvc.perform(patch("/api/v1/admin/users/1/restore"))
                .andExpect(status().isOk());
    }
}
