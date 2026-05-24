package com._eleven.shop.service.user;

import com._eleven.shop.common.constant.MessageConstants;
import com._eleven.shop.dto.user.UpdateProfileRequest;
import com._eleven.shop.dto.auth.ChangePasswordRequest;

import com._eleven.shop.dto.user.UpdateRolesRequest;
import com._eleven.shop.dto.user.UserResponse;
import com._eleven.shop.entity.Role;
import com._eleven.shop.entity.User;
import com._eleven.shop.exception.ResourceNotFoundException;
import com._eleven.shop.repository.user.RoleRepository;
import com._eleven.shop.repository.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public Page<UserResponse> getAllUsers(String search, String status, int page, int size, String direction) {
        Sort.Direction sortDirection = "asc".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, "created_at"));
        Page<User> userPage = userRepository.findAllUsersWithFilters(search, status, pageable);
        return userPage.map(this::toResponse);
    }

    private String getCurrentUserEmail() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            throw new IllegalStateException("Authentication context is null");
        }
        return authentication.getName();
    }

    @Transactional
    public UserResponse updateRoles(Long id, UpdateRolesRequest request) {
        User user = userRepository.findByIdWithDeleted(id)
                .orElseThrow(() -> new ResourceNotFoundException(MessageConstants.USER_NOT_FOUND));

        if (user.isDeleted()) {
            throw new ResourceNotFoundException(MessageConstants.USER_NOT_FOUND);
        }

        // Self-role-demotion prevention check
        String currentUserEmail = getCurrentUserEmail();
        boolean wantsAdmin = request.getRoles().stream().anyMatch(roleName -> roleName.equals("ADMIN"));
        if (user.getEmail().equals(currentUserEmail) && !wantsAdmin) {
            throw new IllegalArgumentException(MessageConstants.CANNOT_DEMOTE_SELF);
        }

        Set<Role> roles = request.getRoles().stream()
                .map(roleName -> roleRepository.findByName(roleName)
                        .orElseGet(() -> roleRepository.save(Role.builder().name(roleName).build())))
                .collect(Collectors.toSet());

        user.setRoles(roles);
        User updatedUser = userRepository.save(user);
        return toResponse(updatedUser);
    }

    @Transactional
    public void lockUser(Long id) {
        User user = userRepository.findByIdWithDeleted(id)
                .orElseThrow(() -> new ResourceNotFoundException(MessageConstants.USER_NOT_FOUND));

        if (user.isDeleted()) {
            throw new ResourceNotFoundException(MessageConstants.USER_NOT_FOUND);
        }

        // Self-lockout prevention check
        String currentUserEmail = getCurrentUserEmail();
        if (user.getEmail().equals(currentUserEmail)) {
            throw new IllegalArgumentException(MessageConstants.CANNOT_LOCK_SELF);
        }

        user.setLocked(true);
        userRepository.save(user);
    }

    @Transactional
    public void restoreUser(Long id) {
        User user = userRepository.findByIdWithDeleted(id)
                .orElseThrow(() -> new ResourceNotFoundException(MessageConstants.USER_NOT_FOUND));
        
        if (user.isDeleted()) {
            throw new ResourceNotFoundException(MessageConstants.USER_NOT_FOUND);
        }
        
        user.setLocked(false);
        userRepository.save(user);
    }

    @Transactional
    public void deleteUser(Long id) {
        User user = userRepository.findByIdWithDeleted(id)
                .orElseThrow(() -> new ResourceNotFoundException(MessageConstants.USER_NOT_FOUND));

        if (user.isDeleted()) {
            throw new ResourceNotFoundException(MessageConstants.USER_NOT_FOUND);
        }

        // Prevent self-deletion
        String currentUserEmail = getCurrentUserEmail();
        if (user.getEmail().equals(currentUserEmail)) {
            throw new IllegalArgumentException(MessageConstants.CANNOT_DELETE_SELF);
        }

        userRepository.delete(user);
    }

    private UserResponse toResponse(User user) {
        if (user == null) {
            return null;
        }
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .roles(user.getRoles().stream().map(Role::getName).collect(Collectors.toList()))
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .deleted(user.isDeleted())
                .locked(user.isLocked())
                .build();
    }

    @Transactional
    public UserResponse updateProfile(String email, com._eleven.shop.dto.user.UpdateProfileRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException(MessageConstants.USER_NOT_FOUND));
        user.setFullName(request.getFullName());
        User updatedUser = userRepository.save(user);
        return toResponse(updatedUser);
    }

    @Transactional
    public void changePassword(String email, com._eleven.shop.dto.auth.ChangePasswordRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException(MessageConstants.USER_NOT_FOUND));

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw new IllegalArgumentException(MessageConstants.WRONG_PASSWORD);
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }
}
