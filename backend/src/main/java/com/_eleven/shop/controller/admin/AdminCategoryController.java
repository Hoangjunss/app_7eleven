package com._eleven.shop.controller.admin;

import com._eleven.shop.aspect.Auditable;
import com._eleven.shop.dto.ApiResponse;
import com._eleven.shop.dto.CategoryRequest;
import com._eleven.shop.dto.CategoryResponse;
import com._eleven.shop.service.CategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/v1/admin/categories")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminCategoryController {

    private final CategoryService categoryService;

    @PostMapping
    @Auditable(action = "CREATE_CATEGORY", entityType = "CATEGORY")
    public ApiResponse<CategoryResponse> createCategory(@Valid @RequestBody CategoryRequest request) {
        CategoryResponse response = categoryService.createCategory(request);
        return ApiResponse.success(response, "Category created successfully");
    }

    @PutMapping("/{id}")
    @Auditable(action = "UPDATE_CATEGORY", entityType = "CATEGORY")
    public ApiResponse<CategoryResponse> updateCategory(
            @PathVariable Long id,
            @Valid @RequestBody CategoryRequest request) {
        CategoryResponse response = categoryService.updateCategory(id, request);
        return ApiResponse.success(response, "Category updated successfully");
    }

    @DeleteMapping("/{id}")
    @Auditable(action = "DELETE_CATEGORY", entityType = "CATEGORY")
    public ApiResponse<Void> deleteCategory(@PathVariable Long id) {
        categoryService.deleteCategory(id);
        return ApiResponse.success(null, "Category deleted successfully");
    }
}
