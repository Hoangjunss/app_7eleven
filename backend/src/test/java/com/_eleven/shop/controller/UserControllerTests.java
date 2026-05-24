package com._eleven.shop.controller;

import com._eleven.shop.aspect.AuditLogAspect;
import com._eleven.shop.controller.admin.AdminUserController;
import com._eleven.shop.dto.user.UserResponse;
import com._eleven.shop.entity.Role;
import com._eleven.shop.entity.User;
import com._eleven.shop.exception.ResourceNotFoundException;
import com._eleven.shop.repository.audit.AuditLogRepository;
import com._eleven.shop.repository.user.RoleRepository;
import com._eleven.shop.repository.user.UserRepository;
import com._eleven.shop.security.JwtAuthenticationFilter;
import com._eleven.shop.security.JwtProvider;
import com._eleven.shop.security.SecurityConfig;
import com._eleven.shop.service.audit.AuditLogService;
import com._eleven.shop.service.user.UserService;
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
import java.util.Optional;
import java.util.Set;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = {AdminUserController.class})
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, AuditLogAspect.class, AuditLogService.class})
@EnableAspectJAutoProxy
public class UserControllerTests {

    @Autowired
    private MockMvc mockMvc;

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
    @WithMockUser(username = "admin@test.com", roles = "ADMIN")
    void testGetUsersAdminRole() throws Exception {
        Mockito.when(userService.getAllUsers(anyString(), anyString(), anyInt(), anyInt(), anyString()))
                .thenReturn(new PageImpl<>(Collections.emptyList()));

        mockMvc.perform(get("/api/v1/admin/users"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "user@test.com", roles = "USER")
    void testGetUsersUserRoleIsForbidden() throws Exception {
        mockMvc.perform(get("/api/v1/admin/users"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "admin@test.com", roles = "ADMIN")
    void testGetUsersFilterByNameOrEmail() throws Exception {
        Mockito.when(userService.getAllUsers(eq("John"), anyString(), anyInt(), anyInt(), anyString()))
                .thenReturn(new PageImpl<>(Collections.emptyList()));

        mockMvc.perform(get("/api/v1/admin/users").param("search", "John"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "admin@test.com", roles = "ADMIN")
    void testGetUsersFilterByLockedStatus() throws Exception {
        Mockito.when(userService.getAllUsers(anyString(), eq("locked"), anyInt(), anyInt(), anyString()))
                .thenReturn(new PageImpl<>(Collections.emptyList()));

        mockMvc.perform(get("/api/v1/admin/users").param("status", "locked"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "admin@test.com", roles = "ADMIN")
    void testLockUserPut() throws Exception {
        Mockito.doNothing().when(userService).lockUser(5L);

        mockMvc.perform(put("/api/v1/admin/users/5/lock"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "admin@test.com", roles = "ADMIN")
    void testRestoreUserPut() throws Exception {
        Mockito.doNothing().when(userService).restoreUser(5L);

        mockMvc.perform(put("/api/v1/admin/users/5/restore"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "admin@test.com", roles = "ADMIN")
    void testDeleteUserSuccess() throws Exception {
        Mockito.doNothing().when(userService).deleteUser(5L);

        mockMvc.perform(delete("/api/v1/admin/users/5"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "admin@test.com", roles = "ADMIN")
    void testDeleteUserSelfThrowsBadRequest() throws Exception {
        Mockito.doThrow(new IllegalArgumentException("You cannot delete your own account"))
                .when(userService).deleteUser(2L);

        mockMvc.perform(delete("/api/v1/admin/users/2"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("You cannot delete your own account"));
    }

    @Test
    @WithMockUser(username = "admin@test.com", roles = "ADMIN")
    void testDeleteUserNotFoundThrowsNotFound() throws Exception {
        Mockito.doThrow(new ResourceNotFoundException("User not found"))
                .when(userService).deleteUser(99L);

        mockMvc.perform(delete("/api/v1/admin/users/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("User not found"));
    }
}
