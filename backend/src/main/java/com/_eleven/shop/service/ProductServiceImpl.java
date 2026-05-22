package com._eleven.shop.service;

import com._eleven.shop.dto.ProductRequest;
import com._eleven.shop.dto.ProductResponse;
import com._eleven.shop.entity.Category;
import com._eleven.shop.entity.Product;
import com._eleven.shop.entity.ProductImage;
import com._eleven.shop.mapper.ProductMapper;
import com._eleven.shop.repository.CategoryRepository;
import com._eleven.shop.repository.ProductRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ProductMapper productMapper;
    private final CloudinaryStorageService cloudinaryStorageService;

    @Override
    @Transactional
    public ProductResponse createProduct(ProductRequest request) {
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new IllegalArgumentException("Category not found"));

        Product product = productMapper.toEntity(request);
        product.setCategory(category);

        product = productRepository.save(product);
        return productMapper.toResponse(product);
    }

    @Override
    @Transactional
    public ProductResponse updateProduct(Long id, ProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new IllegalArgumentException("Category not found"));

        productMapper.updateEntityFromRequest(request, product);
        product.setCategory(category);

        product = productRepository.save(product);
        return productMapper.toResponse(product);
    }

    @Override
    @Transactional
    public void deleteProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));

        // Delete images from Cloudinary
        if (product.getImages() != null) {
            for (ProductImage image : product.getImages()) {
                String publicId = extractPublicId(image.getImageUrl());
                if (publicId != null) {
                    cloudinaryStorageService.deleteFile(publicId);
                }
            }
        }

        productRepository.delete(product);
    }

    @Override
    @Transactional(readOnly = true)
    public ProductResponse getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));
        return productMapper.toResponse(product);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProductResponse> getAllProducts(String name, Long categoryId, BigDecimal minPrice, BigDecimal maxPrice, Pageable pageable) {
        Specification<Product> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (name != null && !name.trim().isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("name")), "%" + name.trim().toLowerCase() + "%"));
            }

            if (categoryId != null) {
                predicates.add(cb.equal(root.get("category").get("id"), categoryId));
            }

            if (minPrice != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("price"), minPrice));
            }

            if (maxPrice != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("price"), maxPrice));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return productRepository.findAll(spec, pageable).map(productMapper::toResponse);
    }

    /**
     * Extracts public ID from Cloudinary URL.
     *
     * @param url Cloudinary URL
     * @return public ID or null if invalid URL
     */
    private String extractPublicId(String url) {
        if (url == null || !url.contains("/upload/")) {
            return null;
        }
        try {
            int uploadIndex = url.indexOf("/upload/");
            String remaining = url.substring(uploadIndex + "/upload/".length());
            if (remaining.startsWith("v")) {
                int firstSlashIndex = remaining.indexOf("/");
                if (firstSlashIndex != -1) {
                    remaining = remaining.substring(firstSlashIndex + 1);
                }
            }
            int lastDotIndex = remaining.lastIndexOf(".");
            if (lastDotIndex != -1) {
                remaining = remaining.substring(0, lastDotIndex);
            }
            return remaining;
        } catch (Exception e) {
            log.warn("Failed to extract public ID from URL: {}", url, e);
            return null;
        }
    }
}
