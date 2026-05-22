package com._eleven.shop.service;

import com._eleven.shop.dto.ProductRequest;
import com._eleven.shop.dto.ProductResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;

public interface ProductService {
    ProductResponse createProduct(ProductRequest request);
    ProductResponse updateProduct(Long id, ProductRequest request);
    void deleteProduct(Long id);
    ProductResponse getProductById(Long id);
    Page<ProductResponse> getAllProducts(String name, Long categoryId, BigDecimal minPrice, BigDecimal maxPrice, Pageable pageable);
}
