package com._eleven.shop.repository;

import com._eleven.shop.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);

    @Query(value = "SELECT * FROM users u WHERE (:search IS NULL OR :search = '' OR u.email ILIKE CONCAT('%', :search, '%') OR u.full_name ILIKE CONCAT('%', :search, '%'))",
           countQuery = "SELECT count(*) FROM users u WHERE (:search IS NULL OR :search = '' OR u.email ILIKE CONCAT('%', :search, '%') OR u.full_name ILIKE CONCAT('%', :search, '%'))",
           nativeQuery = true)
    Page<User> findAllUsersWithDeleted(@Param("search") String search, Pageable pageable);

    @Query(value = "SELECT * FROM users WHERE id = :id", nativeQuery = true)
    Optional<User> findByIdWithDeleted(@Param("id") Long id);
}
