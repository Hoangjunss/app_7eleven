package com._eleven.shop.controller;

import com._eleven.shop.aspect.Auditable;
import com._eleven.shop.dto.ApiResponse;
import com._eleven.shop.dto.OrderRequest;
import com._eleven.shop.dto.OrderResponse;
import com._eleven.shop.entity.OrderStatus;
import com._eleven.shop.entity.User;
import com._eleven.shop.repository.UserRepository;
import com._eleven.shop.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
@Slf4j
public class OrderController {

    private final OrderService orderService;
    private final UserRepository userRepository;

    private Long getUserId(UserDetails userDetails) {
        if (userDetails == null) {
            throw new IllegalArgumentException("User not authenticated");
        }
        return userRepository.findByEmail(userDetails.getUsername())
                .map(User::getId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    @PostMapping
    @Auditable(action = "CREATE_ORDER", entityType = "ORDER")
    public ApiResponse<OrderResponse> createOrder(@AuthenticationPrincipal UserDetails userDetails,
                                                 @Valid @RequestBody OrderRequest request) {
        Long userId = getUserId(userDetails);
        OrderResponse response = orderService.createOrder(userId, request);
        return ApiResponse.success(response, "Order created successfully");
    }

    @GetMapping
    public ApiResponse<Page<OrderResponse>> getOrders(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        Long userId = getUserId(userDetails);
        Sort.Direction sortDirection = Sort.Direction.fromString(direction);
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortBy));
        Page<OrderResponse> orders = orderService.getOrdersForUser(userId, status, pageable);
        return ApiResponse.success(orders, "Orders retrieved successfully");
    }

    @GetMapping("/{id}")
    public ApiResponse<OrderResponse> getOrderDetails(@AuthenticationPrincipal UserDetails userDetails,
                                                       @PathVariable Long id) {
        Long userId = getUserId(userDetails);
        OrderResponse response = orderService.getOrderDetails(userId, id);
        return ApiResponse.success(response, "Order details retrieved successfully");
    }

    @PatchMapping("/{id}/cancel")
    @Auditable(action = "CANCEL_ORDER", entityType = "ORDER")
    public ApiResponse<Void> cancelOrder(@AuthenticationPrincipal UserDetails userDetails,
                                         @PathVariable Long id) {
        Long userId = getUserId(userDetails);
        orderService.cancelOrder(userId, id);
        return ApiResponse.success(null, "Order cancelled successfully");
    }
}
