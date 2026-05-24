package com._eleven.shop.controller;

import com._eleven.shop.aspect.Auditable;
import com._eleven.shop.dto.ApiResponse;
import com._eleven.shop.dto.AuthResponse;
import com._eleven.shop.dto.LoginRequest;
import com._eleven.shop.dto.RegisterRequest;
import com._eleven.shop.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    @Auditable(action = "REGISTER", entityType = "USER")
    public ApiResponse<String> register(@Valid @RequestBody RegisterRequest request) {
        String message = authService.register(request);
        return ApiResponse.success(message, "User registered successfully");
    }

    @PostMapping("/login")
    @Auditable(action = "LOGIN", entityType = "USER")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ApiResponse.success(response, "Login successful");
    }

    @PostMapping("/logout")
    @Auditable(action = "LOGOUT", entityType = "USER")
    public ApiResponse<String> logout() {
        authService.logout();
        return ApiResponse.success("Logged out successfully", "Logout successful");
    }
}

