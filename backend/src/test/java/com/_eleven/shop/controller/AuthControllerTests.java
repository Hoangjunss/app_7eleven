package com._eleven.shop.controller;

import com._eleven.shop.aspect.AuditLogAspect;
import com._eleven.shop.dto.ApiResponse;
import com._eleven.shop.dto.AuthResponse;
import com._eleven.shop.dto.LoginRequest;
import com._eleven.shop.dto.RegisterRequest;
import com._eleven.shop.entity.Role;
import com._eleven.shop.entity.User;
import com._eleven.shop.repository.AuditLogRepository;
import com._eleven.shop.repository.RoleRepository;
import com._eleven.shop.repository.UserRepository;
import com._eleven.shop.security.JwtAuthenticationFilter;
import com._eleven.shop.security.JwtProvider;
import com._eleven.shop.security.SecurityConfig;
import com._eleven.shop.service.AuthService;
import com._eleven.shop.service.AuditLogService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.EnableAspectJAutoProxy;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.mockito.ArgumentMatchers.any;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = {AuthController.class})
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, AuditLogAspect.class, AuditLogService.class})
@EnableAspectJAutoProxy
public class AuthControllerTests {

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
        User dummyUser = User.builder()
                .id(1L)
                .email("user@test.com")
                .roles(Set.of(Role.builder().name("USER").build()))
                .build();
        Mockito.when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(dummyUser));
    }

    @Test
    void testLoginSuccess() throws Exception {
        LoginRequest request = LoginRequest.builder()
                .email("user@test.com")
                .password("password123")
                .build();

        AuthResponse response = AuthResponse.builder()
                .token("dummy-jwt-token")
                .email("user@test.com")
                .fullName("Test User")
                .roles(List.of("USER"))
                .build();

        Mockito.when(authService.login(any(LoginRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.token").value("dummy-jwt-token"))
                .andExpect(jsonPath("$.data.email").value("user@test.com"));
    }

    @Test
    void testLoginIncorrectPassword() throws Exception {
        LoginRequest request = LoginRequest.builder()
                .email("user@test.com")
                .password("wrong-password")
                .build();

        Mockito.when(authService.login(any(LoginRequest.class)))
                .thenThrow(new IllegalArgumentException("Incorrect password, please try again"));

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Incorrect password, please try again"));
    }

    @Test
    void testLoginEmailNotFound() throws Exception {
        LoginRequest request = LoginRequest.builder()
                .email("notfound@test.com")
                .password("password123")
                .build();

        Mockito.when(authService.login(any(LoginRequest.class)))
                .thenThrow(new IllegalArgumentException("Email not found in the system"));

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Email not found in the system"));
    }

    @Test
    void testLoginAccountLocked() throws Exception {
        LoginRequest request = LoginRequest.builder()
                .email("locked@test.com")
                .password("password123")
                .build();

        Mockito.when(authService.login(any(LoginRequest.class)))
                .thenThrow(new IllegalArgumentException("Account is locked. Please contact administrator for support."));

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Account is locked. Please contact administrator for support."));
    }

    @Test
    void testLoginEmptyBody() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(""))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testRegisterSuccess() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .email("new@test.com")
                .password("password123")
                .fullName("New User")
                .build();

        Mockito.when(authService.register(any(RegisterRequest.class))).thenReturn("User registered successfully");

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").value("User registered successfully"));
    }

    @Test
    void testRegisterDuplicateEmail() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .email("duplicate@test.com")
                .password("password123")
                .fullName("New User")
                .build();

        Mockito.when(authService.register(any(RegisterRequest.class)))
                .thenThrow(new IllegalArgumentException("Email is already taken"));

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Email is already taken"));
    }
}
