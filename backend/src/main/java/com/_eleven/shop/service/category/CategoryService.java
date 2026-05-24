package com._eleven.shop.service.category;

import com._eleven.shop.common.constant.MessageConstants;
import com._eleven.shop.dto.category.CategoryRequest;
import com._eleven.shop.dto.category.CategoryResponse;
import com._eleven.shop.entity.Category;
import com._eleven.shop.mapper.category.CategoryMapper;
import com._eleven.shop.repository.category.CategoryRepository;
import com._eleven.shop.repository.product.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final CategoryMapper categoryMapper;
    private final ProductRepository productRepository;

    @Transactional
    public CategoryResponse createCategory(CategoryRequest request) {
        if (categoryRepository.existsByName(request.getName())) {
            throw new IllegalArgumentException(MessageConstants.CATEGORY_NAME_EXISTS);
        }

        Category category = categoryMapper.toEntity(request);
        category = categoryRepository.save(category);
        return categoryMapper.toResponse(category);
    }

    @Transactional
    public CategoryResponse updateCategory(Long id, CategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException(MessageConstants.CATEGORY_NOT_FOUND));

        if (!category.getName().equalsIgnoreCase(request.getName()) && categoryRepository.existsByName(request.getName())) {
            throw new IllegalArgumentException(MessageConstants.CATEGORY_NAME_EXISTS);
        }

        categoryMapper.updateEntityFromRequest(request, category);
        category = categoryRepository.save(category);
        return categoryMapper.toResponse(category);
    }

    @Transactional
    public void deleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException(MessageConstants.CATEGORY_NOT_FOUND));

        if (productRepository.existsByCategoryId(id)) {
            throw new IllegalArgumentException(MessageConstants.CATEGORY_HAS_PRODUCTS);
        }

        categoryRepository.delete(category);
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> getAllCategories() {
        return categoryRepository.findAll().stream()
                .map(categoryMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CategoryResponse getCategoryById(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException(MessageConstants.CATEGORY_NOT_FOUND));
        return categoryMapper.toResponse(category);
    }
}

