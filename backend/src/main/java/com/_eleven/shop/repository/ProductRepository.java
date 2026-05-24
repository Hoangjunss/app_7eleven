package com._eleven.shop.repository;

import com._eleven.shop.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Collection;
import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {
    @Query("SELECT DISTINCT p FROM Product p LEFT JOIN FETCH p.images WHERE p.id IN :ids")
    List<Product> findAllByIdsWithImages(@Param("ids") Collection<Long> ids);

    @Query("SELECT COUNT(p) > 0 FROM Product p WHERE LOWER(TRIM(p.name)) = LOWER(TRIM(:name))")
    boolean existsByNameIgnoreCaseAndTrimmed(@Param("name") String name);

    @Query("SELECT COUNT(p) > 0 FROM Product p WHERE LOWER(TRIM(p.name)) = LOWER(TRIM(:name)) AND p.id <> :id")
    boolean existsByNameIgnoreCaseAndTrimmedForUpdate(@Param("name") String name, @Param("id") Long id);
}
