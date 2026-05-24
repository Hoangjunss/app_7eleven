package com._eleven.shop.service;

import com._eleven.shop.dto.ProductRequest;
import com._eleven.shop.dto.ProductResponse;
import com._eleven.shop.entity.Category;
import com._eleven.shop.entity.Product;
import com._eleven.shop.exception.ResourceNotFoundException;
import com._eleven.shop.mapper.ProductMapper;
import com._eleven.shop.repository.CategoryRepository;
import com._eleven.shop.repository.ProductRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ProductServiceTests {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private ProductMapper productMapper;

    @Mock
    private CloudinaryStorageService cloudinaryStorageService;

    @InjectMocks
    private ProductServiceImpl productService;

    @Test
    void testCreateProductSuccess() {
        ProductRequest request = ProductRequest.builder()
                .name("New Product")
                .categoryId(1L)
                .price(BigDecimal.valueOf(100))
                .build();

        Category category = Category.builder().id(1L).name("Cat").build();
        Product product = Product.builder().name("New Product").category(category).build();
        ProductResponse response = ProductResponse.builder().id(10L).name("New Product").build();

        when(productRepository.existsByNameIgnoreCaseAndTrimmed("New Product")).thenReturn(false);
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(productMapper.toEntity(request)).thenReturn(product);
        when(productRepository.save(any(Product.class))).thenReturn(product);
        when(productMapper.toResponse(product)).thenReturn(response);

        ProductResponse result = productService.createProduct(request, null, null);

        assertNotNull(result);
        assertEquals("New Product", result.getName());
    }

    @Test
    void testCreateProductDuplicateNameThrowsException() {
        ProductRequest request = ProductRequest.builder()
                .name("Duplicate")
                .build();

        when(productRepository.existsByNameIgnoreCaseAndTrimmed("Duplicate")).thenReturn(true);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            productService.createProduct(request, null, null);
        });

        assertEquals("Product name already exists", exception.getMessage());
    }

    @Test
    void testUpdateProductSuccess() {
        ProductRequest request = ProductRequest.builder()
                .name("Updated Product")
                .categoryId(1L)
                .build();

        Category category = Category.builder().id(1L).name("Cat").build();
        Product product = Product.builder().id(5L).name("Old Name").category(category).build();
        ProductResponse response = ProductResponse.builder().id(5L).name("Updated Product").build();

        when(productRepository.findById(5L)).thenReturn(Optional.of(product));
        when(productRepository.existsByNameIgnoreCaseAndTrimmedForUpdate("Updated Product", 5L)).thenReturn(false);
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(productRepository.save(product)).thenReturn(product);
        when(productMapper.toResponse(product)).thenReturn(response);

        ProductResponse result = productService.updateProduct(5L, request);

        assertNotNull(result);
        assertEquals("Updated Product", result.getName());
        verify(productMapper).updateEntityFromRequest(request, product);
    }

    @Test
    void testUpdateProductDuplicateNameThrowsException() {
        ProductRequest request = ProductRequest.builder()
                .name("Duplicate")
                .build();

        Product product = Product.builder().id(5L).name("Old").build();

        when(productRepository.findById(5L)).thenReturn(Optional.of(product));
        when(productRepository.existsByNameIgnoreCaseAndTrimmedForUpdate("Duplicate", 5L)).thenReturn(true);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            productService.updateProduct(5L, request);
        });

        assertEquals("Product name already exists", exception.getMessage());
    }

    @Test
    void testGetProductByIdSuccess() {
        Product product = Product.builder().id(5L).name("Prod").build();
        ProductResponse response = ProductResponse.builder().id(5L).name("Prod").build();

        when(productRepository.findById(5L)).thenReturn(Optional.of(product));
        when(productMapper.toResponse(product)).thenReturn(response);

        ProductResponse result = productService.getProductById(5L);

        assertNotNull(result);
        assertEquals(5L, result.getId());
    }

    @Test
    void testGetProductByIdNotFoundThrowsException() {
        when(productRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> {
            productService.getProductById(99L);
        });
    }

    @Test
    void testGetAllProductsPriceFiltering_MinOnly() {
        BigDecimal minPrice = BigDecimal.valueOf(50);
        Pageable pageable = PageRequest.of(0, 10);

        Product p1 = Product.builder().id(1L).name("P1").price(BigDecimal.valueOf(60)).build();
        Product p2 = Product.builder().id(2L).name("P2").price(BigDecimal.valueOf(100)).build();
        Page<Product> mockPage = new PageImpl<>(List.of(p1, p2));

        when(productRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(mockPage);
        when(productMapper.toResponse(p1)).thenReturn(ProductResponse.builder().price(BigDecimal.valueOf(60)).build());
        when(productMapper.toResponse(p2)).thenReturn(ProductResponse.builder().price(BigDecimal.valueOf(100)).build());

        Page<ProductResponse> result = productService.getAllProducts(null, null, minPrice, null, pageable);

        assertNotNull(result);
        assertEquals(2, result.getContent().size());
        for (ProductResponse response : result.getContent()) {
            assertTrue(response.getPrice().compareTo(minPrice) >= 0);
        }
    }

    @Test
    void testGetAllProductsPriceFiltering_MaxOnly() {
        BigDecimal maxPrice = BigDecimal.valueOf(80);
        Pageable pageable = PageRequest.of(0, 10);

        Product p1 = Product.builder().id(1L).name("P1").price(BigDecimal.valueOf(30)).build();
        Product p2 = Product.builder().id(2L).name("P2").price(BigDecimal.valueOf(75)).build();
        Page<Product> mockPage = new PageImpl<>(List.of(p1, p2));

        when(productRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(mockPage);
        when(productMapper.toResponse(p1)).thenReturn(ProductResponse.builder().price(BigDecimal.valueOf(30)).build());
        when(productMapper.toResponse(p2)).thenReturn(ProductResponse.builder().price(BigDecimal.valueOf(75)).build());

        Page<ProductResponse> result = productService.getAllProducts(null, null, null, maxPrice, pageable);

        assertNotNull(result);
        assertEquals(2, result.getContent().size());
        for (ProductResponse response : result.getContent()) {
            assertTrue(response.getPrice().compareTo(maxPrice) <= 0);
        }
    }

    @Test
    void testGetAllProductsPriceFiltering_Both() {
        BigDecimal minPrice = BigDecimal.valueOf(20);
        BigDecimal maxPrice = BigDecimal.valueOf(60);
        Pageable pageable = PageRequest.of(0, 10);

        Product p1 = Product.builder().id(1L).name("P1").price(BigDecimal.valueOf(25)).build();
        Product p2 = Product.builder().id(2L).name("P2").price(BigDecimal.valueOf(50)).build();
        Page<Product> mockPage = new PageImpl<>(List.of(p1, p2));

        when(productRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(mockPage);
        when(productMapper.toResponse(p1)).thenReturn(ProductResponse.builder().price(BigDecimal.valueOf(25)).build());
        when(productMapper.toResponse(p2)).thenReturn(ProductResponse.builder().price(BigDecimal.valueOf(50)).build());

        Page<ProductResponse> result = productService.getAllProducts(null, null, minPrice, maxPrice, pageable);

        assertNotNull(result);
        assertEquals(2, result.getContent().size());
        for (ProductResponse response : result.getContent()) {
            assertTrue(response.getPrice().compareTo(minPrice) >= 0);
            assertTrue(response.getPrice().compareTo(maxPrice) <= 0);
        }
    }

    @Test
    void testGetAllProductsPriceFiltering_None() {
        Pageable pageable = PageRequest.of(0, 10);

        Product p1 = Product.builder().id(1L).name("P1").price(BigDecimal.valueOf(10)).build();
        Product p2 = Product.builder().id(2L).name("P2").price(BigDecimal.valueOf(200)).build();
        Page<Product> mockPage = new PageImpl<>(List.of(p1, p2));

        when(productRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(mockPage);
        when(productMapper.toResponse(p1)).thenReturn(ProductResponse.builder().price(BigDecimal.valueOf(10)).build());
        when(productMapper.toResponse(p2)).thenReturn(ProductResponse.builder().price(BigDecimal.valueOf(200)).build());

        Page<ProductResponse> result = productService.getAllProducts(null, null, null, null, pageable);

        assertNotNull(result);
        assertEquals(2, result.getContent().size());
    }
}
