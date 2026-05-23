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

@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final UserService userService;

    @GetMapping
    public ApiResponse<Page<UserResponse>> getAllUsers(
            @RequestParam(required = false, defaultValue = "") String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<UserResponse> users = userService.getAllUsers(search, page, size);
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

    @DeleteMapping("/{id}")
    @Auditable(action = "LOCK_USER", entityType = "USER")
    public ApiResponse<Void> lockUser(@PathVariable Long id) {
        userService.lockUser(id);
        return ApiResponse.success(null, "User locked successfully");
    }

    @PatchMapping("/{id}/restore")
    @Auditable(action = "RESTORE_USER", entityType = "USER")
    public ApiResponse<Void> restoreUser(@PathVariable Long id) {
        userService.restoreUser(id);
        return ApiResponse.success(null, "User restored successfully");
    }
}
