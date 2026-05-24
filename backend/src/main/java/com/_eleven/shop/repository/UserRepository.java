package com._eleven.shop.repository;

import com._eleven.shop.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);

    @Query(value = "SELECT * FROM users WHERE email = :email", nativeQuery = true)
    Optional<User> findByEmailWithDeleted(@Param("email") String email);

    @Query(value = "SELECT * FROM users u WHERE " +
                   "u.deleted = false " +
                   "AND (:search IS NULL OR :search = '' OR u.email ILIKE CONCAT('%', :search, '%') OR u.full_name ILIKE CONCAT('%', :search, '%')) " +
                   "AND (:status = 'all' OR (:status = 'active' AND u.locked = false) OR (:status = 'locked' AND u.locked = true))",
           countQuery = "SELECT count(*) FROM users u WHERE " +
                        "u.deleted = false " +
                        "AND (:search IS NULL OR :search = '' OR u.email ILIKE CONCAT('%', :search, '%') OR u.full_name ILIKE CONCAT('%', :search, '%')) " +
                        "AND (:status = 'all' OR (:status = 'active' AND u.locked = false) OR (:status = 'locked' AND u.locked = true))",
           nativeQuery = true)
    Page<User> findAllUsersWithFilters(@Param("search") String search, @Param("status") String status, Pageable pageable);

    @Query(value = "SELECT * FROM users WHERE id = :id", nativeQuery = true)
    Optional<User> findByIdWithDeleted(@Param("id") Long id);

    @Query("SELECT COUNT(u) FROM User u WHERE u.deleted = false AND u.createdAt >= :startDate AND u.createdAt <= :endDate")
    long countNewUsersBetween(@Param("startDate") OffsetDateTime startDate, @Param("endDate") OffsetDateTime endDate);

    @Query("SELECT COUNT(u) FROM User u WHERE u.deleted = false AND u.locked = true")
    long countLockedUsers();

    @Query("SELECT CAST(u.createdAt AS date) as dateVal, COUNT(u) as countVal " +
           "FROM User u " +
           "WHERE u.deleted = false AND u.createdAt BETWEEN :startDate AND :endDate " +
           "GROUP BY CAST(u.createdAt AS date) " +
           "ORDER BY dateVal ASC")
    List<Object[]> findUserRegistrationsChart(@Param("startDate") OffsetDateTime startDate, @Param("endDate") OffsetDateTime endDate);
}
