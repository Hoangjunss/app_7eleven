package com._eleven.shop.security;

import com._eleven.shop.aspect.AuditLogAspect;
import com._eleven.shop.controller.AuthController;
import com._eleven.shop.controller.admin.AdminTestController;
import com._eleven.shop.dto.ApiResponse;
import com._eleven.shop.dto.AuthResponse;
import com._eleven.shop.dto.LoginRequest;
import com._eleven.shop.dto.RegisterRequest;
import com._eleven.shop.entity.AuditLog;
import com._eleven.shop.entity.Role;
import com._eleven.shop.entity.User;
import com._eleven.shop.repository.AuditLogRepository;
import com._eleven.shop.repository.RoleRepository;
import com._eleven.shop.repository.UserRepository;
import com._eleven.shop.service.AuthService;
import com._eleven.shop.service.AuditLogService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.EnableAspectJAutoProxy;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = {AuthController.class, AdminTestController.class})
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, AuditLogAspect.class, AuditLogService.class})
@EnableAspectJAutoProxy
public class SecurityPermissionTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthService authService;

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
        // Setup default mock behaviors for user repository queries
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
    void testRegisterSuccess() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .email("user@test.com")
                .password("password123")
                .fullName("Test User")
                .build();

        Mockito.when(authService.register(any(RegisterRequest.class))).thenReturn("User registered successfully");

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        ArgumentCaptor<AuditLog> logCaptor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepository, times(1)).save(logCaptor.capture());

        AuditLog captured = logCaptor.getValue();
        assertEquals("REGISTER", captured.getAction());
        assertEquals("SUCCESS", captured.getResult());
        assertEquals("user@test.com", captured.getActorEmail());
        assertEquals("1", captured.getActorId());
        assertNotNull(captured.getDetails());
    }

    @Test
    void testRegisterFailure() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .email("user@test.com")
                .password("password123")
                .fullName("Test User")
                .build();

        Mockito.when(authService.register(any(RegisterRequest.class)))
                .thenThrow(new IllegalArgumentException("Email is already taken"));

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        ArgumentCaptor<AuditLog> logCaptor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepository, times(1)).save(logCaptor.capture());

        AuditLog captured = logCaptor.getValue();
        assertEquals("REGISTER", captured.getAction());
        assertEquals("FAILED", captured.getResult());
        assertEquals("Email is already taken", captured.getErrorMessage());
    }

    @Test
    void testLoginSuccess() throws Exception {
        LoginRequest request = LoginRequest.builder()
                .email("user@test.com")
                .password("password123")
                .build();

        AuthResponse authResponse = AuthResponse.builder()
                .token("dummy-token")
                .email("user@test.com")
                .fullName("Test User")
                .roles(List.of("USER"))
                .build();

        Mockito.when(authService.login(any(LoginRequest.class))).thenReturn(authResponse);

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        ArgumentCaptor<AuditLog> logCaptor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepository, times(1)).save(logCaptor.capture());

        AuditLog captured = logCaptor.getValue();
        assertEquals("LOGIN_SUCCESS", captured.getAction());
        assertEquals("SUCCESS", captured.getResult());
        assertEquals("user@test.com", captured.getActorEmail());
    }

    @Test
    void testLoginFailure() throws Exception {
        LoginRequest request = LoginRequest.builder()
                .email("user@test.com")
                .password("wrong-password")
                .build();

        Mockito.when(authService.login(any(LoginRequest.class)))
                .thenThrow(new BadCredentialsException("Invalid email or password"));

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());

        ArgumentCaptor<AuditLog> logCaptor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepository, times(1)).save(logCaptor.capture());

        AuditLog captured = logCaptor.getValue();
        assertEquals("LOGIN_FAILED", captured.getAction());
        assertEquals("FAILED", captured.getResult());
    }

    @Test
    @WithMockUser(username = "user@test.com", roles = "USER")
    void testLogout() throws Exception {
        mockMvc.perform(post("/api/v1/auth/logout"))
                .andExpect(status().isOk());

        ArgumentCaptor<AuditLog> logCaptor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepository, times(1)).save(logCaptor.capture());

        AuditLog captured = logCaptor.getValue();
        assertEquals("LOGOUT", captured.getAction());
        assertEquals("SUCCESS", captured.getResult());
        assertEquals("user@test.com", captured.getActorEmail());
    }

    @Test
    void testAdminAccessWithoutAuth() throws Exception {
        mockMvc.perform(get("/api/v1/admin/hello"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "user@test.com", roles = "USER")
    void testAdminAccessWithUserRole() throws Exception {
        mockMvc.perform(get("/api/v1/admin/hello"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "admin@test.com", roles = "ADMIN")
    void testAdminAccessWithAdminRole() throws Exception {
        mockMvc.perform(get("/api/v1/admin/hello"))
                .andExpect(status().isOk());
    }
}
