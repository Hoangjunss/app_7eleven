package com._eleven.shop.controller.admin;

import com._eleven.shop.aspect.Auditable;
import com._eleven.shop.dto.common.ApiResponse;
import com._eleven.shop.dto.product.ProductRequest;
import com._eleven.shop.dto.product.ProductResponse;
import com._eleven.shop.service.product.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;

import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/v1/admin/products")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminProductController {

    private final ProductService productService;

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    @Auditable(action = "CREATE_PRODUCT", entityType = "PRODUCT")
    public ApiResponse<ProductResponse> createProductJson(@Valid @RequestBody ProductRequest request) {
        ProductResponse response = productService.createProduct(request, null, null);
        return ApiResponse.success(response, "Product created successfully");
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    @Auditable(action = "CREATE_PRODUCT", entityType = "PRODUCT")
    public ApiResponse<ProductResponse> createProductMultipart(
            @RequestPart("product") @Valid ProductRequest request,
            @RequestPart(value = "images", required = false) MultipartFile[] images,
            @RequestParam(value = "primaryImageIndex", defaultValue = "0") Integer primaryImageIndex) {
        ProductResponse response = productService.createProduct(request, images, primaryImageIndex);
        return ApiResponse.success(response, "Product created successfully");
    }

    @PostMapping(value = "/{id}/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Auditable(action = "UPDATE_PRODUCT", entityType = "PRODUCT")
    public ApiResponse<ProductResponse> uploadProductImages(
            @PathVariable Long id,
            @RequestPart("images") MultipartFile[] images,
            @RequestParam(value = "primaryImageIndex", defaultValue = "0") Integer primaryImageIndex) {
        ProductResponse response = productService.uploadProductImages(id, images, primaryImageIndex);
        return ApiResponse.success(response, "Product images uploaded successfully");
    }

    @PutMapping("/{id}")
    @Auditable(action = "UPDATE_PRODUCT", entityType = "PRODUCT")
    public ApiResponse<ProductResponse> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody ProductRequest request) {
        ProductResponse response = productService.updateProduct(id, request);
        return ApiResponse.success(response, "Product updated successfully");
    }

    @DeleteMapping("/{id}")
    @Auditable(action = "DELETE_PRODUCT", entityType = "PRODUCT")
    public ApiResponse<Void> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ApiResponse.success(null, "Product deleted successfully");
    }

    @GetMapping("/{id}")
    public ApiResponse<ProductResponse> getProductById(@PathVariable Long id) {
        ProductResponse response = productService.getProductById(id);
        return ApiResponse.success(response, "Product retrieved successfully");
    }

    @GetMapping
    public ApiResponse<Page<ProductResponse>> getAllProducts(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        Sort.Direction sortDirection = Sort.Direction.fromString(direction);
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortBy));
        Page<ProductResponse> products = productService.getAllProducts(name, categoryId, minPrice, maxPrice, pageable);
        return ApiResponse.success(products, "Products retrieved successfully");
    }
}
