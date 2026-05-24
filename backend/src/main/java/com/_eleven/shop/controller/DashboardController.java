package com._eleven.shop.controller;

import com._eleven.shop.dto.*;
import com._eleven.shop.entity.User;
import com._eleven.shop.repository.ProductRepository;
import com._eleven.shop.repository.UserRepository;
import com._eleven.shop.service.DashboardService;
import com._eleven.shop.mapper.ProductMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
@Slf4j
public class DashboardController {

    private final DashboardService dashboardService;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final ProductMapper productMapper;

    private Long getUserId(UserDetails userDetails) {
        if (userDetails == null) {
            throw new IllegalArgumentException("User not authenticated");
        }
        return userRepository.findByEmail(userDetails.getUsername())
                .map(User::getId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    @GetMapping("/hot-this-month")
    public ResponseEntity<ApiResponse<List<HotProductResponse>>> getHotThisMonth() {
        List<TopProductResponse> topProducts = dashboardService.getTopProductsThisMonth();
        List<HotProductResponse> hotProducts = new ArrayList<>();
        for (TopProductResponse tp : topProducts) {
            productRepository.findById(tp.getProductId()).ifPresent(p -> {
                hotProducts.add(HotProductResponse.builder()
                        .id(p.getId())
                        .name(p.getName())
                        .price(p.getPrice())
                        .imageUrl(productMapper.getPrimaryImageUrl(p))
                        .quantitySold(tp.getTotalQuantitySold())
                        .build());
            });
        }
        return ResponseEntity.ok(ApiResponse.success(hotProducts));
    }

    @GetMapping("/recent")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getRecentOrders(@AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        List<OrderResponse> data = dashboardService.getRecentOrdersForUser(userId);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @GetMapping("/suggestions")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getSuggestions(@AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        List<ProductResponse> data = dashboardService.getProductSuggestionsForUser(userId);
        return ResponseEntity.ok(ApiResponse.success(data));
    }
}
