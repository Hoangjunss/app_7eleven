package com._eleven.shop.service.product;

import com._eleven.shop.dto.product.ProductRequest;
import com._eleven.shop.dto.product.ProductResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;

public interface ProductService {
    ProductResponse createProduct(ProductRequest request, MultipartFile[] images, Integer primaryImageIndex);
    ProductResponse updateProduct(Long id, ProductRequest request);
    void deleteProduct(Long id);
    ProductResponse getProductById(Long id);
    Page<ProductResponse> getAllProducts(String name, Long categoryId, BigDecimal minPrice, BigDecimal maxPrice, Pageable pageable);
    
    // Add images to an existing product
    ProductResponse uploadProductImages(Long productId, MultipartFile[] images, Integer primaryImageIndex);
}
