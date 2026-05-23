# Kế Hoạch Tối Ưu Hóa & Sửa Lỗi Backend (Spring Boot)

Tài liệu này chi tiết hóa các file cần sửa đổi, các đoạn code thay đổi và quy trình kiểm thử để giải quyết lỗi bảo mật, hiệu năng (N+1 Query) và logging trong dự án **7Eleven Shop**, tuân thủ ràng buộc **giữ nguyên Cloudinary**.

---

## 1. Các File Cần Sửa Đổi & Nội Dung Chi Tiết

### 1.1 Bảo mật (Security)

#### 1. [SecurityConfig.java](file:///D:/7eleven/backend/src/main/java/com/_eleven/shop/security/SecurityConfig.java)
Cấu hình CORS để giới hạn domain truy cập ở môi trường Production.
```diff
     @Bean
     public CorsConfigurationSource corsConfigurationSource() {
         CorsConfiguration configuration = new CorsConfiguration();
-        configuration.setAllowedOriginPatterns(List.of("*"));
+        // Giới hạn các nguồn gốc tin cậy (Frontend) cho môi trường dev & prod
+        configuration.setAllowedOrigins(List.of(
+            "http://localhost:3000",
+            "http://103.72.99.211:3000"
+        ));
         configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
         configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Requested-With", "Accept", "Origin"));
         configuration.setExposedHeaders(List.of("Authorization"));
```

#### 2. Thêm `@PreAuthorize("hasRole('ADMIN')")` ở Class-level
Bổ sung annotation bảo vệ ở mức Controller để kích hoạt phòng thủ chiều sâu (Defense in Depth) tại các file:
- [`AdminUserController.java`](file:///D:/7eleven/backend/src/main/java/com/_eleven/shop/controller/admin/AdminUserController.java)
- [`AdminProductController.java`](file:///D:/7eleven/backend/src/main/java/com/_eleven/shop/controller/admin/AdminProductController.java)
- [`AdminOrderController.java`](file:///D:/7eleven/backend/src/main/java/com/_eleven/shop/controller/admin/AdminOrderController.java)
- [`AdminCategoryController.java`](file:///D:/7eleven/backend/src/main/java/com/_eleven/shop/controller/admin/AdminCategoryController.java)

*Ví dụ chỉnh sửa tại `AdminUserController.java`:*
```java
@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')") // Thêm dòng này bảo vệ toàn bộ endpoints trong class
public class AdminUserController { ... }
```

---

### 1.2 Logging & Exception Handling

#### 1. [GlobalExceptionHandler.java](file:///D:/7eleven/backend/src/main/java/com/_eleven/shop/exception/GlobalExceptionHandler.java)
Thêm `@Slf4j` và log lỗi stacktrace chi tiết khi bắt exception không mong muốn (HTTP 500).
```diff
+import lombok.extern.slf4j.Slf4j;
 
 @RestControllerAdvice
+@Slf4j
 public class GlobalExceptionHandler {
...
     @ExceptionHandler(Exception.class)
     public ResponseEntity<ApiResponse<Void>> handleGlobalException(Exception ex) {
+        log.error("Internal Server Error: ", ex); // Log chi tiết lỗi kèm theo stacktrace
         ApiResponse<Void> response = ApiResponse.error(ex.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR.value());
         return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
     }
 }
```

---

### 1.3 Tối ưu Hiệu năng (N+1 Query & RAM Optimization)

#### 1. [ProductRepository.java](file:///D:/7eleven/backend/src/main/java/com/_eleven/shop/repository/ProductRepository.java)
Thêm phương thức query hàng loạt kết hợp `LEFT JOIN FETCH` để lấy nhanh danh sách ảnh của sản phẩm.
```java
package com._eleven.shop.repository;

import com._eleven.shop.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {
    @Query("SELECT DISTINCT p FROM Product p LEFT JOIN FETCH p.images WHERE p.id IN :ids")
    List<Product> findAllByIdsWithImages(@Param("ids") Collection<Long> ids);
}
```

#### 2. [CartServiceImpl.java](file:///D:/7eleven/backend/src/main/java/com/_eleven/shop/service/CartServiceImpl.java)
Sửa hàm `getCart(Long userId)` để query giỏ hàng chỉ trong 1 câu SQL thay vì lặp N lần.
```java
    @Override
    @Transactional(readOnly = true)
    public CartResponse getCart(Long userId) {
        String key = cartKey(userId);
        Map<String, Integer> entries = hashOps().entries(key);
        List<CartItemResponse> items = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;
        
        if (entries.isEmpty()) {
            return CartResponse.builder().items(items).totalAmount(total).build();
        }

        // 1. Thu thập tất cả các productId dưới dạng Long
        List<Long> productIds = entries.keySet().stream()
                .map(Long::valueOf)
                .toList();

        // 2. Query batch 1 lần duy nhất lấy toàn bộ Product và Images (Fetch Join)
        List<Product> products = productRepository.findAllByIdsWithImages(productIds);
        Map<Long, Product> productMap = products.stream()
                .collect(Collectors.toMap(Product::getId, p -> p));

        // 3. Xây dựng danh sách CartItemResponse
        for (Map.Entry<String, Integer> entry : entries.entrySet()) {
            Long productId = Long.valueOf(entry.getKey());
            Integer qty = entry.getValue();
            Product product = productMap.get(productId);
            
            if (product == null) {
                log.warn("Product with id {} not found while building cart for user {}", productId, userId);
                continue;
            }
            
            BigDecimal subtotal = product.getPrice().multiply(BigDecimal.valueOf(qty));
            CartItemResponse item = CartItemResponse.builder()
                    .productId(productId)
                    .productName(product.getName())
                    .price(product.getPrice())
                    .thumbnailUrl(product.getImages().isEmpty() ? null : product.getImages().get(0).getImageUrl())
                    .quantity(qty)
                    .subtotal(subtotal)
                    .build();
            items.add(item);
            total = total.add(subtotal);
        }
        
        return CartResponse.builder()
                .items(items)
                .totalAmount(total)
                .build();
    }
```

#### 3. [OrderRepository.java](file:///D:/7eleven/backend/src/main/java/com/_eleven/shop/repository/OrderRepository.java)
Sửa query để nạp trước `order_items` trong các đơn hàng gần đây, tránh N+1 Query.
```diff
-    @Query("SELECT o FROM Order o ORDER BY o.createdAt DESC")
+    @Query("SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.items ORDER BY o.createdAt DESC")
     List<Order> findRecentOrders(Pageable pageable);
```

Đồng thời, thêm câu query Group By thống kê doanh thu trực tiếp dưới DB:
```java
    @Query("SELECT CAST(o.createdAt AS date) as dateVal, SUM(o.totalAmount) as revenue, COUNT(o) as orderCount " +
           "FROM Order o " +
           "WHERE o.status = :status AND o.createdAt BETWEEN :startDate AND :endDate " +
           "GROUP BY CAST(o.createdAt AS date) " +
           "ORDER BY dateVal ASC")
    List<Object[]> findRevenueChartData(
            @Param("status") OrderStatus status,
            @Param("startDate") OffsetDateTime startDate,
            @Param("endDate") OffsetDateTime endDate
    );
```

#### 4. [DashboardServiceImpl.java](file:///D:/7eleven/backend/src/main/java/com/_eleven/shop/service/DashboardServiceImpl.java)
Cải tiến `getRevenueChart` để tận dụng phương thức Group By vừa tạo.
```java
    @Override
    @Transactional(readOnly = true)
    public List<RevenueChartResponse> getRevenueChart(OffsetDateTime startDate, OffsetDateTime endDate) {
        // Query dữ liệu đã Group By từ DB
        List<Object[]> rows = orderRepository.findRevenueChartData(OrderStatus.DELIVERED, startDate, endDate);

        // Pre-fill để điền đầy đủ các ngày trống với giá trị 0
        Map<LocalDate, BigDecimal> revenueMap = new TreeMap<>();
        Map<LocalDate, Long> countMap = new HashMap<>();

        LocalDate startLocalDate = startDate.toLocalDate();
        LocalDate endLocalDate = endDate.toLocalDate();
        for (LocalDate date = startLocalDate; !date.isAfter(endLocalDate); date = date.plusDays(1)) {
            revenueMap.put(date, BigDecimal.ZERO);
            countMap.put(date, 0L);
        }

        // Ánh xạ kết quả từ DB vào Map
        for (Object[] row : rows) {
            LocalDate dateVal = null;
            if (row[0] instanceof java.sql.Date sqlDate) {
                dateVal = sqlDate.toLocalDate();
            } else if (row[0] instanceof java.time.LocalDate localDate) {
                dateVal = localDate;
            } else if (row[0] instanceof java.util.Date utilDate) {
                dateVal = new java.sql.Date(utilDate.getTime()).toLocalDate();
            }
            
            BigDecimal revenue = (BigDecimal) row[1];
            Long count = (Long) row[2];
            
            if (dateVal != null && revenueMap.containsKey(dateVal)) {
                revenueMap.put(dateVal, revenue);
                countMap.put(dateVal, count);
            }
        }

        return revenueMap.keySet().stream()
                .map(date -> new RevenueChartResponse(
                        date.toString(),
                        revenueMap.get(date),
                        countMap.get(date)
                ))
                .collect(Collectors.toList());
    }
```

---

### 1.4 Loại bỏ Credential Hardcode

#### 1. [application.yml](file:///D:/7eleven/backend/src/main/resources/application.yml)
Xóa bỏ các giá trị fallback cứng cho Cloudinary credentials.
```diff
 cloudinary:
-  cloud-name: ${CLOUDINARY_CLOUD_NAME:dgts7tmnb}
-  api-key: ${CLOUDINARY_API_KEY:572933874577745}
-  api-secret: ${CLOUDINARY_API_SECRET:CgRjc0dmftxHE6F8m1k-SRwXEVo}
+  cloud-name: ${CLOUDINARY_CLOUD_NAME}
+  api-key: ${CLOUDINARY_API_KEY}
+  api-secret: ${CLOUDINARY_API_SECRET}
```

---

## 2. Quy Trình Kiểm Thử (Verification Plan)

### 2.1 Automated Tests
1. **Chạy JUnit Tests:**
   Thực hiện build dự án và chạy các unit/integration test để đảm bảo các thay đổi tối ưu hiệu năng không làm hỏng logic nghiệp vụ:
   ```bash
   mvn clean test
   ```

### 2.2 Manual Verification
1. **Khởi chạy Hệ thống:**
   Build lại các images và khởi động hệ thống với file `.env.dev`:
   ```bash
   docker compose --env-file .env.dev -f docker-compose.yml -f docker-compose.dev.yml up --build -d
   ```
2. **Kiểm tra Phân quyền (Security):**
   - Đăng nhập bằng tài khoản role `USER`, sau đó thực hiện gọi API tới `/api/v1/admin/users` hoặc `/api/v1/admin/products`.
   - Kết quả mong đợi: API trả về lỗi `403 Forbidden` do các Admin Controller đã được chặn trực tiếp bằng `@PreAuthorize("hasRole('ADMIN')")`.
3. **Kiểm tra Hiệu năng (N+1 Query & Dashboard):**
   - Xem log SQL phát sinh khi truy cập vào giỏ hàng (`/api/v1/cart`) có nhiều sản phẩm.
     - Mong đợi: Chỉ phát sinh **1 câu truy vấn** JOIN giữa bảng `products` và `product_images`.
   - Truy cập trang Dashboard để kiểm tra biểu đồ doanh thu.
     - Mong đợi: Biểu đồ tải bình thường, log SQL thể hiện câu query `GROUP BY` trực tiếp theo ngày.
4. **Kiểm tra Logging:**
   - Kích hoạt một lỗi hệ thống hoặc gửi một dữ liệu lỗi để kích hoạt `Exception` không kiểm soát (Ví dụ: truyền sai định dạng ID sản phẩm).
   - Kiểm tra log của container backend (`docker logs -f shop-backend`).
     - Mong đợi: Stacktrace chi tiết được log ra màn hình console, giúp lập trình viên kiểm soát lỗi.
5. **Kiểm tra Cloudinary Upload:**
   - Tạo sản phẩm mới kèm hình ảnh qua Admin Dashboard.
   - Mong đợi: Ảnh được upload lên Cloudinary bình thường, không xảy ra lỗi kết nối (Do credentials được truyền chính xác từ biến môi trường/file `.env.dev`).
