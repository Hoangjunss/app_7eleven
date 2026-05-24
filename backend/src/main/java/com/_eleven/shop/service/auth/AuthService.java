package com._eleven.shop.service.auth;

import com._eleven.shop.common.constant.MessageConstants;
import com._eleven.shop.dto.auth.AuthResponse;
import com._eleven.shop.dto.auth.LoginRequest;
import com._eleven.shop.dto.auth.RegisterRequest;
import com._eleven.shop.entity.Role;
import com._eleven.shop.entity.User;
import com._eleven.shop.repository.user.RoleRepository;
import com._eleven.shop.repository.user.UserRepository;
import com._eleven.shop.security.JwtProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtProvider jwtProvider;

    @Transactional
    public String register(RegisterRequest request) {
        if (userRepository.findByEmailWithDeleted(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException(MessageConstants.EMAIL_TAKEN);
        }

        Role userRole = roleRepository.findByName("USER")
                .orElseGet(() -> roleRepository.save(Role.builder().name("USER").build()));

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .roles(Set.of(userRole))
                .build();

        userRepository.save(user);
        return "User registered successfully";
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        // 1. Check if user exists (including soft deleted/locked users)
        User user = userRepository.findByEmailWithDeleted(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException(MessageConstants.LOGIN_FAILED));

        // 2. Check if user is soft deleted (hidden completely)
        if (user.isDeleted()) {
            throw new IllegalArgumentException(MessageConstants.LOGIN_FAILED);
        }

        // 3. Check if user account is locked
        if (user.isLocked()) {
            throw new IllegalArgumentException(MessageConstants.ACCOUNT_LOCKED);
        }

        // 3. Verify password
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException(MessageConstants.WRONG_PASSWORD);
        }

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String token = jwtProvider.generateToken(userDetails);

        return AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .fullName(user.getFullName())
                .roles(user.getRoles().stream().map(Role::getName).collect(Collectors.toList()))
                .build();
    }

    public void logout() {
        SecurityContextHolder.clearContext();
    }
}

