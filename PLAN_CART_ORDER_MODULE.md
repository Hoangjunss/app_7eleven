# PLAN_CART_ORDER_MODULE.md

## Tổng quan
- **Tổng số phase:** 4 Phase (bao gồm thiết lập, giỏ hàng, đặt hàng và kiểm thử tích hợp)
- **Tổng thời gian dự kiến:** 14 giờ

---

## Phase 1: Cơ sở dữ liệu và Cấu hình Redis Cart
**Mục tiêu:** Thiết lập cấu trúc lưu trữ cơ sở dữ liệu cho Đơn hàng trong PostgreSQL, đồng thời cấu hình kết nối Redis và thiết lập serializer chuẩn hóa dữ liệu giỏ hàng để dễ quản lý.  
**Thời gian:** 3 giờ  

**Tasks:**
- [ ] **Task 1: Tạo file migration Flyway cho Order**
  - Tạo file `V5__create_order_and_order_item_tables.sql` thiết lập bảng `orders` (chứa các trường mã đơn hàng `order_code` unique dạng `ORD-YYYYMMDD-NNNN`, `user_id`, trạng thái `status` dạng Enum, tổng tiền `total_amount`, phương thức thanh toán `payment_method` mặc định COD, trạng thái thanh toán `payment_status`, các cột thông tin người nhận snapshot để lưu lịch sử, các cột audit `created_at`, `updated_at`, `deleted_at`).
  - Thiết lập bảng `order_items` (quan hệ 1-N với `orders`, chứa `product_id`, snapshot tên sản phẩm `product_name_snapshot`, snapshot giá `price_snapshot`, số lượng `quantity`, tổng tiền dòng `subtotal`).
- [ ] **Task 2: Cấu hình Spring Data Redis và Serializer**
  - Bổ sung cấu hình Redis connection trong `application-dev.yml` và `application-prod.yml` (nếu chưa có).
  - Cấu hình `RedisConfig` cấu trúc bean `RedisTemplate<String, Object>` sử dụng `StringRedisSerializer` cho Key/HashKey và `GenericJackson2JsonRedisSerializer` hoặc `Jackson2JsonRedisSerializer` cho Value/HashValue giúp dữ liệu giỏ hàng lưu trữ trên Redis ở dạng JSON thân thiện thay vì dạng nhị phân mặc định của Java.
- [ ] **Task 3: Thiết kế DTOs cho Giỏ hàng (Cart)**
  - Tạo `CartItemResponse` chứa `productId`, `productName`, `price`, `thumbnailUrl`, `quantity`, `subtotal`.
  - Tạo `CartResponse` chứa danh sách các items và `totalAmount` tổng tiền giỏ hàng.

**Commit messages gợi ý:**
- `db(migration): create schema for orders and order items`
- `config(redis): configure redis template with JSON serializer for cart operations`
- `feat(cart): implement cart response DTOs for client presentation`

---

## Phase 2: Nghiệp vụ và APIs Giỏ hàng (Cart Module)
**Mục tiêu:** Triển khai toàn bộ nghiệp vụ giỏ hàng lưu trữ trên Redis với thời gian sống (TTL) là 7 ngày, cung cấp đầy đủ các API thêm, sửa, xóa, hiển thị sản phẩm trong giỏ hàng.  
**Thời gian:** 3 giờ  

**Tasks:**
- [ ] **Task 1: Xây dựng CartService nghiệp vụ với Redis**
  - Khai báo interface `CartService` và lớp triển khai `CartServiceImpl`.
  - Triển khai `addItemToCart(Long userId, Long productId, int quantity)`: Đọc từ Redis hash `cart:{userId}`, tăng số lượng cộng dồn nếu sản phẩm đã tồn tại, đồng thời thiết lập TTL cho key là 7 ngày (604800 giây).
  - Triển khai `updateCartItem(Long userId, Long productId, int quantity)`: Cập nhật đè trực tiếp số lượng mới của sản phẩm, ném lỗi nếu số lượng $\le 0$ hoặc sản phẩm không tồn tại.
  - Triển khai `removeCartItem(Long userId, Long productId)`: Xóa field `productId` khỏi Hash Redis.
  - Triển khai `clearCart(Long userId)`: Xóa toàn bộ key `cart:{userId}` trong Redis.
  - Triển khai `getCart(Long userId)`: Lấy toàn bộ dữ liệu từ Redis Hash, load chi tiết thông tin sản phẩm (name, price, primary image URL) từ `ProductRepository` để build ra `CartResponse` đầy đủ và tính toán tổng tiền chính xác.
- [ ] **Task 2: Triển khai REST Controller cho Cart**
  - Tạo `CartController` tại `/api/v1/cart` yêu cầu xác thực người dùng (lấy `userId` trực tiếp từ thông tin JWT token của Spring Security Context).
  - `GET /api/v1/cart`: Xem chi tiết giỏ hàng hiện tại.
  - `POST /api/v1/cart/items`: Thêm sản phẩm vào giỏ (body nhận `productId`, `quantity`).
  - `PUT /api/v1/cart/items/{productId}`: Cập nhật số lượng sản phẩm trong giỏ.
  - `DELETE /api/v1/cart/items/{productId}`: Xóa một sản phẩm khỏi giỏ.
  - `DELETE /api/v1/cart`: Làm trống giỏ hàng.

**Commit messages gợi ý:**
- `feat(cart): implement CartService business logic utilizing Redis Hash`
- `feat(cart): implement CartController endpoints under authenticated context`

---

## Phase 3: Nghiệp vụ Đặt hàng & Lịch sử Đơn hàng phía User (Order Module)
**Mục tiêu:** Triển khai nghiệp vụ đặt hàng đồng bộ an toàn từ giỏ hàng Redis vào PostgreSQL, áp dụng trừ kho tồn kho có kiểm soát tranh chấp đồng thời bằng Optimistic Locking, và xây dựng lịch sử đơn hàng của User.  
**Thời gian:** 4 giờ  

**Tasks:**
- [ ] **Task 1: Định nghĩa Order State Machine & DTOs**
  - Khai báo các trạng thái đơn hàng (`OrderStatus`: `PENDING`, `CONFIRMED`, `SHIPPING`, `DELIVERED`, `CANCELLED`).
  - Khai báo các trạng thái thanh toán (`PaymentStatus`: `PENDING`, `PAID`, `CANCELLED`).
  - Triển khai logic kiểm tra chuyển đổi trạng thái hợp lệ trong Enum `OrderStatus` (ví dụ: không được chuyển từ `PENDING` thẳng lên `DELIVERED`, hay đơn hàng đã `CANCELLED` thì không thể chuyển trạng thái khác).
  - Thiết kế `OrderRequest` (nhận thông tin giao hàng: `recipientName`, `recipientPhone`, `deliveryAddress`, `note`).
  - Thiết kế `OrderResponse` và `OrderItemResponse` chứa snapshot đầy đủ thông tin đơn hàng trả về.
- [ ] **Task 2: Triển khai OrderService nghiệp vụ Đặt hàng**
  - Khởi tạo `OrderRepository` và `OrderItemRepository`.
  - Triển khai `createOrder(Long userId, OrderRequest request)` chạy trong `@Transactional`:
    1. Đọc thông tin giỏ hàng của user từ Redis. Nếu trống, ném `IllegalArgumentException`.
    2. Duyệt qua từng item, truy vấn dữ liệu sản phẩm trong DB để kiểm tra tồn kho. Nếu thiếu hàng, ném `InsufficientStockException` (trả về mã lỗi HTTP 422).
    3. Giảm số lượng tồn kho của sản phẩm: `product.setStockQuantity(product.getStockQuantity() - quantity)`. Lưu lại sản phẩm (Spring JPA sẽ tự động kiểm tra `@Version` để ngăn chặn overselling nếu có luồng khác vừa ghi đè).
    4. Sinh mã đơn hàng ngẫu nhiên không trùng lặp theo định dạng `ORD-YYYYMMDD-NNNN`.
    5. Tạo đối tượng `Order` và các `OrderItem` lưu giữ thông tin snapshot tên và giá tại thời điểm mua.
    6. Lưu đơn hàng vào PostgreSQL.
    7. Gọi `cartService.clearCart(userId)` để dọn sạch giỏ hàng trong Redis.
  - Triển khai `getOrdersForUser(Long userId, OrderStatus status, Pageable pageable)`: Lấy lịch sử đơn hàng của user có phân trang và lọc theo trạng thái.
  - Triển khai `getOrderDetails(Long userId, Long orderId)`: Xem chi tiết đơn hàng (kiểm tra quyền sở hữu, chỉ cho phép chủ đơn hàng hoặc Admin xem).
  - Triển khai `cancelOrder(Long userId, Long orderId)`: Cho phép user hủy đơn hàng (chỉ khi trạng thái đơn hàng đang là `PENDING`). Thực hiện hoàn trả lại số lượng tồn kho cho các sản phẩm trong đơn và cập nhật trạng thái đơn thành `CANCELLED`.
- [ ] **Task 3: Triển khai REST Controller cho Order**
  - Tạo `OrderController` tại `/api/v1/orders` (yêu cầu đăng nhập).
  - `POST /api/v1/orders`: Tạo đơn hàng mới từ giỏ hàng. Tích hợp `@Auditable(action = "CREATE_ORDER", entityType = "ORDER")`.
  - `GET /api/v1/orders`: Xem lịch sử đơn hàng của user (hỗ trợ phân trang, lọc theo status).
  - `GET /api/v1/orders/{id}`: Xem chi tiết một đơn hàng.
  - `PATCH /api/v1/orders/{id}/cancel`: Hủy đơn hàng đang chờ xử lý. Tích hợp `@Auditable(action = "CANCEL_ORDER", entityType = "ORDER")`.

**Commit messages gợi ý:**
- `feat(order): define OrderStatus, PaymentStatus and request response DTOs`
- `feat(order): implement createOrder business logic with stock check and database persistence`
- `feat(order): implement user OrderController APIs for placing and viewing orders`

---

## Phase 4: Quản lý Đơn hàng cho Admin, Ghi log & Kiểm thử (Testing)
**Mục tiêu:** Xây dựng các chức năng quản trị đơn hàng dành cho Admin, tích hợp AOP Audit logging hoàn chỉnh và triển khai bộ test cases tự động xác thực phân quyền, kiểm tra giỏ hàng Redis và tranh chấp tồn kho thực tế.  
**Thời gian:** 4 giờ  

**Tasks:**
- [ ] **Task 1: Triển khai APIs Admin Quản lý Đơn hàng**
  - Tạo `AdminOrderController` tại `/api/v1/admin/orders` (yêu cầu quyền `ADMIN`).
  - `GET /api/v1/admin/orders`: Liệt kê danh sách toàn bộ đơn hàng trong hệ thống (phân trang, lọc theo trạng thái, khách hàng).
  - `GET /api/v1/admin/orders/{id}`: Xem chi tiết đơn hàng bất kỳ.
  - `PATCH /api/v1/admin/orders/{id}/status`: Cập nhật trạng thái đơn hàng (sử dụng logic state machine đã viết để validate sự hợp lệ của bước chuyển tiếp). Tích hợp `@Auditable(action = "UPDATE_ORDER_STATUS", entityType = "ORDER")`.
- [ ] **Task 2: Viết Integration Tests cho Cart & Order**
  - Tạo `CartIntegrationTests.java`: Sử dụng MockMvc kết hợp với Redis test container hoặc mock/embedded Redis để kiểm thử hoạt động thêm, sửa, xóa sản phẩm trong giỏ hàng.
  - Tạo `OrderIntegrationTests.java` (Active profile `test` sử dụng H2 DB):
    - Kiểm thử phân quyền: User không xem được đơn hàng của người khác, anonymous bị chặn, Admin truy cập được tất cả.
    - Kiểm thử tranh chấp tồn kho đồng thời (Concurrency / Optimistic Lock): Giả lập 2 luồng đồng thời gọi `POST /api/v1/orders` mua cùng 1 sản phẩm có số lượng tồn kho có hạn. Xác minh 1 luồng mua thành công và luồng còn lại ném lỗi `ObjectOptimisticLockingFailureException` (HTTP 409 Conflict) để chứng minh tính an toàn tuyệt đối, không xảy ra bán quá số lượng thực tế (overselling).
- [ ] **Task 3: Thực hiện kiểm thử thủ công và dọn dẹp**
  - Khởi động toàn bộ các dịch vụ trên local bằng Docker Compose.
  - Thực hiện flow hoàn chỉnh: Login $\rightarrow$ Add sản phẩm $\rightarrow$ Xem giỏ hàng $\rightarrow$ Đặt hàng $\rightarrow$ Xác minh giỏ hàng Redis được xóa $\rightarrow$ Admin cập nhật trạng thái đơn hàng $\rightarrow$ Check bảng `audit_logs` để xác nhận các hoạt động đã được ghi dấu đầy đủ.

**Commit messages gợi ý:**
- `feat(order): implement AdminOrderController endpoints with status transition validation`
- `test(cart): add integration tests for redis-based cart operations`
- `test(order): add concurrency integration tests for product optimistic locking during checkout`
