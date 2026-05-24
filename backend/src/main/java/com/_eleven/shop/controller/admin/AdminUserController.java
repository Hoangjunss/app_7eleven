package com._eleven.shop.controller.admin;

import com._eleven.shop.aspect.Auditable;
import com._eleven.shop.dto.ApiResponse;
import com._eleven.shop.dto.UpdateRolesRequest;
import com._eleven.shop.dto.UserResponse;
import com._eleven.shop.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final UserService userService;

    @GetMapping
    public ApiResponse<Page<UserResponse>> getAllUsers(
            @RequestParam(required = false, defaultValue = "") String search,
            @RequestParam(required = false, defaultValue = "all") String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "desc") String direction) {
        Page<UserResponse> users = userService.getAllUsers(search, status, page, size, direction);
        return ApiResponse.success(users, "Users retrieved successfully");
    }

    @PatchMapping("/{id}/roles")
    @Auditable(action = "UPDATE_USER_ROLES", entityType = "USER")
    public ApiResponse<UserResponse> updateRoles(
            @PathVariable Long id,
            @Valid @RequestBody UpdateRolesRequest request) {
        UserResponse user = userService.updateRoles(id, request);
        return ApiResponse.success(user, "User roles updated successfully");
    }

    @PutMapping("/{id}/lock")
    @Auditable(action = "LOCK_USER", entityType = "USER")
    public ApiResponse<Void> lockUserPut(@PathVariable Long id) {
        userService.lockUser(id);
        return ApiResponse.success(null, "User locked successfully");
    }

    @PutMapping("/{id}/restore")
    @Auditable(action = "RESTORE_USER", entityType = "USER")
    public ApiResponse<Void> restoreUserPut(@PathVariable Long id) {
        userService.restoreUser(id);
        return ApiResponse.success(null, "User restored successfully");
    }

    @PatchMapping("/{id}/restore")
    @Auditable(action = "RESTORE_USER", entityType = "USER")
    public ApiResponse<Void> restoreUser(@PathVariable Long id) {
        userService.restoreUser(id);
        return ApiResponse.success(null, "User restored successfully");
    }

    @DeleteMapping("/{id}")
    @Auditable(action = "DELETE_USER", entityType = "USER")
    public ApiResponse<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ApiResponse.success(null, "User deleted successfully");
    }
}
