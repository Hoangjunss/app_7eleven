package com._eleven.shop.service;

import com._eleven.shop.dto.UpdateRolesRequest;
import com._eleven.shop.dto.UserResponse;
import com._eleven.shop.entity.Role;
import com._eleven.shop.entity.User;
import com._eleven.shop.repository.RoleRepository;
import com._eleven.shop.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    @Transactional(readOnly = true)
    public Page<UserResponse> getAllUsers(String search, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").ascending());
        Page<User> userPage = userRepository.findAllUsersWithDeleted(search, pageable);
        return userPage.map(this::toResponse);
    }

    @Transactional
    public UserResponse updateRoles(Long id, UpdateRolesRequest request) {
        User user = userRepository.findByIdWithDeleted(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));

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
        if (!userRepository.existsById(id)) {
            // Check in case user exists but is soft-deleted
            userRepository.findByIdWithDeleted(id)
                    .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));
        }
        userRepository.lockUser(id);
    }

    @Transactional
    public void restoreUser(Long id) {
        userRepository.findByIdWithDeleted(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));
        userRepository.restoreUser(id);
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
                .deletedAt(user.getDeletedAt())
                .build();
    }
}
