package com._eleven.shop.service;

import com._eleven.shop.common.constant.MessageConstants;
import com._eleven.shop.service.auth.AuthService;

import com._eleven.shop.dto.auth.AuthResponse;
import com._eleven.shop.dto.auth.LoginRequest;
import com._eleven.shop.dto.auth.RegisterRequest;
import com._eleven.shop.entity.Role;
import com._eleven.shop.entity.User;
import com._eleven.shop.repository.user.RoleRepository;
import com._eleven.shop.repository.user.UserRepository;
import com._eleven.shop.security.JwtProvider;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AuthServiceTests {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtProvider jwtProvider;

    @InjectMocks
    private AuthService authService;

    @Test
    void testRegisterSuccess() {
        RegisterRequest request = RegisterRequest.builder()
                .email("new@test.com")
                .password("password123")
                .fullName("New User")
                .build();

        when(userRepository.findByEmailWithDeleted("new@test.com")).thenReturn(Optional.empty());
        when(roleRepository.findByName("USER")).thenReturn(Optional.of(Role.builder().name("USER").build()));
        when(passwordEncoder.encode("password123")).thenReturn("hashedPassword");

        String result = authService.register(request);

        assertEquals("User registered successfully", result);
        verify(userRepository).save(any(User.class));
    }

    @Test
    void testRegisterDuplicateActiveEmailThrowsException() {
        RegisterRequest request = RegisterRequest.builder()
                .email("existing@test.com")
                .password("password123")
                .fullName("Existing User")
                .build();

        User activeUser = User.builder()
                .email("existing@test.com")
                .deleted(false)
                .build();

        when(userRepository.findByEmailWithDeleted("existing@test.com")).thenReturn(Optional.of(activeUser));

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            authService.register(request);
        });

        assertEquals(MessageConstants.EMAIL_TAKEN, exception.getMessage());
    }

    @Test
    void testRegisterDuplicateDeletedEmailThrowsException() {
        RegisterRequest request = RegisterRequest.builder()
                .email("deleted@test.com")
                .password("password123")
                .fullName("Deleted User")
                .build();

        User deletedUser = User.builder()
                .email("deleted@test.com")
                .deleted(true)
                .build();

        when(userRepository.findByEmailWithDeleted("deleted@test.com")).thenReturn(Optional.of(deletedUser));

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            authService.register(request);
        });

        assertEquals(MessageConstants.EMAIL_TAKEN, exception.getMessage());
    }

    @Test
    void testLoginSuccess() {
        LoginRequest request = LoginRequest.builder()
                .email("active@test.com")
                .password("correctPassword")
                .build();

        Role userRole = Role.builder().name("USER").build();
        User user = User.builder()
                .email("active@test.com")
                .password("hashedPassword")
                .fullName("Active User")
                .roles(Set.of(userRole))
                .deleted(false)
                .locked(false)
                .build();

        when(userRepository.findByEmailWithDeleted("active@test.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("correctPassword", "hashedPassword")).thenReturn(true);

        Authentication auth = mock(Authentication.class);
        UserDetails userDetails = mock(UserDetails.class);
        when(auth.getPrincipal()).thenReturn(userDetails);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(auth);
        when(jwtProvider.generateToken(userDetails)).thenReturn("dummyToken");

        AuthResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals("dummyToken", response.getToken());
        assertEquals("active@test.com", response.getEmail());
        assertEquals("Active User", response.getFullName());
        assertTrue(response.getRoles().contains("USER"));
    }

    @Test
    void testLoginNonExistentEmailThrowsException() {
        LoginRequest request = LoginRequest.builder()
                .email("nonexistent@test.com")
                .password("password")
                .build();

        when(userRepository.findByEmailWithDeleted("nonexistent@test.com")).thenReturn(Optional.empty());

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            authService.login(request);
        });

        assertEquals(MessageConstants.LOGIN_FAILED, exception.getMessage());
    }

    @Test
    void testLoginDeletedUserThrowsException() {
        LoginRequest request = LoginRequest.builder()
                .email("deleted@test.com")
                .password("password")
                .build();

        User user = User.builder()
                .email("deleted@test.com")
                .deleted(true)
                .build();

        when(userRepository.findByEmailWithDeleted("deleted@test.com")).thenReturn(Optional.of(user));

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            authService.login(request);
        });

        assertEquals(MessageConstants.LOGIN_FAILED, exception.getMessage());
    }

    @Test
    void testLoginLockedUserThrowsException() {
        LoginRequest request = LoginRequest.builder()
                .email("locked@test.com")
                .password("password")
                .build();

        User user = User.builder()
                .email("locked@test.com")
                .locked(true)
                .deleted(false)
                .build();

        when(userRepository.findByEmailWithDeleted("locked@test.com")).thenReturn(Optional.of(user));

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            authService.login(request);
        });

        assertEquals(MessageConstants.ACCOUNT_LOCKED, exception.getMessage());
    }

    @Test
    void testLoginIncorrectPasswordThrowsException() {
        LoginRequest request = LoginRequest.builder()
                .email("active@test.com")
                .password("wrongPassword")
                .build();

        User user = User.builder()
                .email("active@test.com")
                .password("hashedPassword")
                .deleted(false)
                .locked(false)
                .build();

        when(userRepository.findByEmailWithDeleted("active@test.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrongPassword", "hashedPassword")).thenReturn(false);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            authService.login(request);
        });

        assertEquals(MessageConstants.WRONG_PASSWORD, exception.getMessage());
    }
}
