package com._eleven.shop.mapper;

import com._eleven.shop.dto.ProductImageResponse;
import com._eleven.shop.dto.ProductRequest;
import com._eleven.shop.dto.ProductResponse;
import com._eleven.shop.entity.Product;
import com._eleven.shop.entity.ProductImage;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface ProductMapper {

    @Mapping(target = "category", ignore = true)
    @Mapping(target = "images", ignore = true)
    Product toEntity(ProductRequest request);

    @Mapping(target = "categoryId", source = "category.id")
    @Mapping(target = "categoryName", source = "category.name")
    @Mapping(target = "primaryImageUrl", expression = "java(getPrimaryImageUrl(product))")
    ProductResponse toResponse(Product product);

    ProductImageResponse toImageResponse(ProductImage productImage);

    default String getPrimaryImageUrl(Product product) {
        if (product.getImages() == null || product.getImages().isEmpty()) {
            return null;
        }
        return product.getImages().stream()
                .filter(ProductImage::getIsPrimary)
                .map(ProductImage::getImageUrl)
                .findFirst()
                .orElse(product.getImages().get(0).getImageUrl());
    }

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "category", ignore = true)
    @Mapping(target = "images", ignore = true)
    @Mapping(target = "version", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    void updateEntityFromRequest(ProductRequest request, @MappingTarget Product product);
}
