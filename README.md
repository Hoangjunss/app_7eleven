# 7Eleven Shop – E‑commerce Platform (Java Fresher Developer Test)

[![Java](https://img.shields.io/badge/Java-21-orange?logo=openjdk&logoColor=white)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.x-brightgreen?logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-red?logo=redis&logoColor=white)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-Compose-blue?logo=docker&logoColor=white)](https://www.docker.com/)

Hệ thống E-commerce nguyên khối (Monolithic), hiệu năng cao, được thiết kế cho bài test tuyển dụng **Java Fresher Developer** tại **7-Eleven**. Dự án tích hợp đầy đủ trang mua sắm dành cho khách hàng và bảng điều khiển quản trị (Admin Dashboard) hiện đại, triển khai thực tế trên Cloud VPS thông qua Docker.

---

## 📋 Thông Tin Chung

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Tên dự án** | **7Eleven Shop** |
| **Ứng viên** | **Vũ Hoàng Chung** |
| **Vị trí ứng tuyển**| **Fresher Java Developer** |
| **Công ty ứng tuyển**| **7-Eleven Việt Nam** |
| **Ngày hoàn thành** | **24/05/2026** |

---

## 🌐 Live Demo & Tài Khoản Thử Nghiệm

Ứng dụng đã được cấu hình và chạy thực tế trên Cloud VPS. Bạn có thể kiểm tra trực tiếp các giao diện thông qua các liên kết dưới đây:

*   **Trang Mua Sắm (Customer):** [https://test7eleven.online](https://test7eleven.online)

### 🔑 Tài Khoản Đăng Nhập

| Vai trò | Email | Mật khẩu | Phạm vi sử dụng |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@7eleven.com` | `admin123` | Cả trang Admin & Trang Mua Sắm |
| **User 1** | `user1@example.com` | `user123` | Chỉ trang Mua Sắm |
| **User 2** | `user2@example.com` | `user123` | Chỉ trang Mua Sắm |

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

Hệ thống tuân thủ nghiêm ngặt các quy tắc ràng buộc công nghệ (Tech Stack constraints) trong yêu cầu dự án:

### Backend
*   **Ngôn ngữ & Core:** Java 21, Spring Boot 3.2+, Maven.
*   **Bảo mật & Auth:** Spring Security, Stateless JWT (Access token có hiệu lực 7 ngày, không sử dụng refresh token/blacklist để tối ưu hóa hiệu năng và độ phức tạp).
*   **Cơ sở dữ liệu:** PostgreSQL 16 (chính) + Redis 7 (chỉ dùng lưu trữ Giỏ hàng dạng key-value tạm thời với TTL 7 ngày).
*   **Migration:** Flyway tự động hóa quản lý phiên bản cơ sở dữ liệu.
*   **Audit Logging:** Custom Aspect-Oriented Programming (AOP) tự động ghi vết các giao dịch nhạy cảm của người dùng/admin vào bảng `audit_logs` trong PostgreSQL.
*   **Khác:** MapStruct (ánh xạ DTO/Entity), Lombok, Cloudinary SDK (quản lý và lưu trữ hình ảnh sản phẩm).
*   *Cam kết:* Không sử dụng RabbitMQ/Kafka, MongoDB, Elasticsearch, Cassandra, SSE/WebSockets hoặc các thư viện gửi mail tự động nhằm tuân thủ thiết kế tối giản, ổn định của MVP.

### Frontend
*   **Core:** Next.js 14 (App Router), TypeScript.
*   **Giao diện & Styling:** Tailwind CSS, shadcn/ui components (Radix UI).
*   **Quản lý State:** Zustand (quản lý trạng thái giỏ hàng local và phiên đăng nhập).
*   **Truy vấn dữ liệu:** React Query (TanStack Query) + Axios (đồng bộ dữ liệu, tự động cache, xử lý interceptors tự động chuyển hướng khi hết hạn token).
*   **Biểu đồ & Thống kê:** Recharts (vẽ biểu đồ xu hướng doanh thu và trạng thái đơn hàng).

### DevOps & Hạ tầng
*   **Đóng gói:** Docker, Docker Compose đa container.
*   **Web Server:** Nginx (Reverse Proxy, SSL Let's Encrypt, giới hạn rate limiting cơ bản).
*   **Hosting:** VPS Ubuntu Server.

---

## 🖥️ Chi Tiết 16 Màn Hình Ứng Dụng (Giao Giao Diện Frontend)

Hệ thống Next.js được xây dựng hoàn chỉnh với **đúng 16 màn hình chức năng** (không tính các file redirect điều hướng thuần túy):

### A. Nhóm Màn Hình Khách Hàng (Customer - 10 Màn Hình)

1.  **Trang Chủ / Tìm Kiếm Sản Phẩm (`/`)**:
    *   Giao diện danh sách sản phẩm với các bộ lọc thông minh (theo danh mục, khoảng giá từ thấp đến cao, tìm kiếm từ khóa).
    *   Tích hợp phân trang mượt mà (Pagination) và chức năng xem nhanh thông tin cơ bản của sản phẩm.
2.  **Trang Chi Tiết Sản Phẩm (`/products/[id]`)**:
    *   Hiển thị chi tiết mô tả sản phẩm, giá bán, số lượng tồn kho.
    *   Hỗ trợ xem album ảnh bằng Carousel trượt mượt mà. Nút "Thêm vào giỏ hàng" và tăng giảm số lượng sản phẩm.
3.  **Trang Giỏ Hàng (`/cart`)**:
    *   Danh sách sản phẩm đã thêm trong giỏ (dữ liệu đồng bộ trực tiếp với Redis tạm thời của server).
    *   Hỗ trợ thay đổi trực tiếp số lượng từng sản phẩm (có kiểm tra stock-limit thời gian thực) hoặc xóa sản phẩm khỏi giỏ hàng.
4.  **Trang Thanh Toán (`/checkout`)**:
    *   Form nhập thông tin giao nhận hàng (Tên, Số điện thoại, Địa chỉ giao hàng, Ghi chú đơn hàng).
    *   Bảng tóm tắt đơn hàng (tổng giá trị sản phẩm, phí ship tạm tính) và nút xác nhận đặt hàng với phương thức Thanh toán khi nhận hàng (COD).
5.  **Bảng Điều Khiển Khách Hàng (`/dashboard`)**:
    *   Trang tổng quan cá nhân hiển thị: Danh mục gợi ý sản phẩm phù hợp, Top các sản phẩm bán chạy nhất trong tháng và danh sách 5 đơn hàng mua sắm gần nhất.
6.  **Trang Lịch Sử Đơn Hàng (`/orders`)**:
    *   Màn hình danh sách toàn bộ các đơn hàng người dùng đã đặt.
    *   Hỗ trợ lọc nhanh đơn hàng theo trạng thái (`PENDING`, `CONFIRMED`, `SHIPPING`, `DELIVERED`, `CANCELLED`).
7.  **Trang Chi Tiết Đơn Hàng (`/orders/[id]`)**:
    *   Xem chi tiết từng mặt hàng đã đặt, thông tin người nhận, trạng thái thanh toán và lịch sử giao nhận.
    *   Tích hợp nút **"Hủy đơn hàng"** trực tiếp nếu đơn hàng đang ở trạng thái `PENDING`.
8.  **Trang Hồ Sơ Cá Nhân (`/profile`)**:
    *   Hiển thị và cập nhật thông tin cá nhân của người dùng (Họ tên, email, số điện thoại).
9.  **Trang Đăng Nhập (`/login`)**:
    *   Form đăng nhập sử dụng email và mật khẩu. Tự động kiểm tra quyền hạn (Role) để điều hướng Admin vào trang quản trị hoặc User vào trang mua sắm.
10. **Trang Đăng Ký (`/register`)**:
    *   Màn hình tạo tài khoản khách hàng mới với các bước xác thực dữ liệu đầu vào phía Client (JSR-380 tương ứng ở backend).

### B. Nhóm Màn Hình Quản Trị (Admin - 6 Màn Hình)

11. **Bảng Thống Kê KPI & Doanh Thu (`/admin/dashboard`)**:
    *   Bảng điều khiển trung tâm hiển thị các thẻ KPI (Tổng doanh thu đơn giao thành công, số lượng đơn hàng, số sản phẩm đang bán, số người dùng).
    *   Biểu đồ cột/đường xu hướng doanh thu từng ngày và biểu đồ tròn thể hiện cơ cấu trạng thái đơn hàng thông qua Recharts.
12. **Quản Lý Danh Mục Sản Phẩm (`/admin/categories`)**:
    *   Màn hình hiển thị danh sách các phân loại sản phẩm dưới dạng bảng.
    *   Hỗ trợ Thêm mới danh mục, Sửa tên/mô tả và Xóa danh mục (có cơ chế kiểm tra chặn xóa nếu danh mục đang chứa sản phẩm).
13. **Quản Lý Sản Phẩm (`/admin/products`)**:
    *   Bảng quản trị sản phẩm tích hợp tìm kiếm và hiển thị tồn kho.
    *   Hỗ trợ thêm mới hoặc cập nhật sản phẩm bằng Form dữ liệu phức tạp (Multipart-form) cho phép chọn và upload ảnh trực tiếp lên Cloudinary. Xóa mềm sản phẩm (Soft Delete).
14. **Quản Lý Danh Sách Đơn Hàng (`/admin/orders`)**:
    *   Bảng quản trị đơn hàng toàn hệ thống, hỗ trợ lọc trạng thái và phân trang.
    *   Giúp admin theo dõi nhanh doanh số giao hàng và tìm kiếm đơn hàng theo mã.
15. **Chi Tiết Đơn Hàng & Cập Nhật Trạng Thái (`/admin/orders/[id]`)**:
    *   Hiển thị chi tiết thông tin và danh sách mặt hàng của đơn hàng.
    *   Chứa **Dropdown cập nhật trạng thái đơn hàng** (tuân thủ nghiêm ngặt máy trạng thái chuyển đổi đơn: `PENDING` -> `CONFIRMED` -> `SHIPPING` -> `DELIVERED`).
16. **Quản Lý Quyền Người Dùng (`/admin/users`)**:
    *   Bảng hiển thị toàn bộ người dùng đăng ký trên hệ thống.
    *   Cho phép Admin điều chỉnh vai trò (`Role`) từ `USER` sang `ADMIN` hoặc ngược lại và khóa/kích hoạt tài khoản.

---

## 📁 Cấu Trúc Thư Mục Dự Án (Sau Khi Tái Cấu Trúc)

Mã nguồn backend đã được tái cấu trúc từ dạng phẳng sang cấu trúc dạng module (Domain-driven package) để dễ dàng quản lý và mở rộng:

```text
7eleven/
├── backend/                    # Ứng dụng Spring Boot
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/_eleven/shop/
│   │   │   │   ├── aspect/     # AOP Audit Logger (Ghi nhật ký hệ thống)
│   │   │   │   ├── common/
│   │   │   │   │   └── constant/
│   │   │   │   │       └── MessageConstants.java # Tập trung hóa tất cả thông báo lỗi
│   │   │   │   ├── config/     # Các cấu hình hệ thống (Redis, Security, Cloudinary)
│   │   │   │   ├── controller/ # Các Endpoint REST API được nhóm theo Module
│   │   │   │   │   ├── admin/      # Nhóm API dành riêng cho Admin
│   │   │   │   │   ├── auth/       # API Đăng ký, đăng nhập, đăng xuất
│   │   │   │   │   ├── cart/       # API quản lý giỏ hàng
│   │   │   │   │   ├── category/   # API quản lý danh mục sản phẩm
│   │   │   │   │   ├── dashboard/  # API cung cấp số liệu thống kê cho Admin
│   │   │   │   │   ├── order/      # API đặt hàng và quản lý đơn của User
│   │   │   │   │   ├── product/    # API xem và tìm kiếm sản phẩm của User
│   │   │   │   │   └── user/       # API quản lý profile
│   │   │   │   ├── dto/        # Lớp DTO chuyển tải dữ liệu được chia theo Module
│   │   │   │   ├── entity/     # Các thực thể JPA Hibernate (Ánh xạ PostgreSQL)
│   │   │   │   ├── exception/  # Xử lý ngoại lệ tập trung trả về chuẩn RFC 7807
│   │   │   │   ├── mapper/     # Lớp chuyển đổi MapStruct (DTO <-> Entity)
│   │   │   │   ├── repository/ # Tầng truy cập Database Spring Data JPA theo Module
│   │   │   │   ├── security/   # Triển khai bộ lọc JWT Filter & Spring Security
│   │   │   │   └── service/    # Logic nghiệp vụ (Business Service) theo Module
│   │   │   └── resources/
│   │   │       ├── db/migration/ # Flyway Database Migrations
│   │   │       └── application-prod.yml
│   │   └── test/               # Bộ kiểm thử tự động JUnit & Mockito
│   ├── Dockerfile
│   └── pom.xml
│
├── frontend/                   # Ứng dụng Next.js (App Router)
│   ├── src/
│   │   ├── app/                # Các trang (Page) cấu trúc 16 màn hình
│   │   ├── components/         # Giao diện dùng chung và thư viện shadcn/ui
│   │   ├── hooks/              # Custom Hooks React Query
│   │   ├── lib/                # Cấu hình Axios Client
│   │   ├── services/           # Lớp gọi API tập trung
│   │   └── stores/             # Quản lý trạng thái bằng Zustand
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml          # Script chạy container đồng bộ Production
└── .env.prod.example           # File mẫu cấu hình biến môi trường
```

*Lưu ý:* Tên package gốc ban đầu là `com.7eleven.shop` nhưng do ký tự số đứng đầu không hợp lệ trong quy tắc định danh Java package, hệ thống đã được cấu hình thống nhất về tên package hợp lệ là `com._eleven.shop`.

---

## 🔒 Các Vấn Đề Gặp Phải & Giải Pháp Xử Lý Chi Tiết (Kèm Đánh Đổi - Trade-offs)

Dưới đây là chi tiết 10 vấn đề kỹ thuật và kiến trúc cốt lõi đã được giải quyết trong suốt quá trình xây dựng ứng dụng, giải pháp xử lý và phân tích đánh đổi (trade-offs) chi tiết:

### 1. Tránh Tranh Chấp Tồn Kho Đồng Thời & Chống Bán Vượt (Optimistic Locking & Concurrency Control)
*   **Vấn đề:** Khi có nhiều luồng khách hàng (ví dụ: User A và User B) cùng đặt mua một sản phẩm có số lượng tồn kho giới hạn (chỉ còn 1 sản phẩm) tại cùng một thời điểm, nếu hệ thống không kiểm soát đồng thời, cả hai đơn hàng đều có thể được tạo thành công, dẫn đến tình trạng bán vượt tồn kho thực tế (overselling) và gây sai lệch số liệu sản phẩm.
*   **Giải pháp:** Sử dụng cơ chế khóa lạc quan (Optimistic Locking) thông qua annotation `@Version` của JPA/Hibernate trên thực thể `Product` (cột `version`). Khi cập nhật kho hàng tại `OrderServiceImpl`, Spring Boot sẽ kiểm tra xem phiên bản sản phẩm trong DB có khớp với phiên bản được đọc ra lúc đầu hay không. Nếu có giao dịch khác đã cập nhật trước, hệ thống sẽ ném ra ngoại lệ `OptimisticLockingFailureException`. Ngoại lệ này được cấu hình xử lý tập trung trong `GlobalExceptionHandler` để trả về mã trạng thái HTTP 409 Conflict với thông báo rõ ràng cho khách hàng.
*   **Đánh đổi (Trade-off):**
    *   *Ưu điểm:* Hiệu năng hệ thống cực cao, không block luồng DB (Pessimistic Lock) gây nghẽn hàng đợi kết nối khi lưu lượng truy cập lớn.
    *   *Nhược điểm:* Khách hàng gửi yêu cầu thanh toán muộn hơn sẽ bị hủy giao dịch đặt hàng và phải thực hiện lại từ đầu. Tuy nhiên, tỷ lệ xung đột này rất thấp trong môi trường thực tế và hoàn toàn chấp nhận được so với việc làm chậm toàn bộ hệ thống.

### 2. Dọn Sạch Giỏ Hàng An Toàn Sau Commit Transaction (Transaction-safe Redis Cart Eviction)
*   **Vấn đề:** Sau khi người dùng đặt hàng thành công, giỏ hàng tạm của họ trên Redis cần được xóa sạch. Nếu thực hiện xóa giỏ hàng trực tiếp trong thân hàm `createOrder()` của Service, nhưng sau đó giao dịch lưu đơn hàng PostgreSQL bị thất bại (do lỗi ràng buộc dữ liệu hoặc lỗi khóa lạc quan ở bước lưu DB sau đó) và rollback, người dùng sẽ bị mất sạch giỏ hàng hiện tại của họ trong khi đơn hàng chưa được tạo thành công, tạo ra trải nghiệm người dùng cực kỳ tồi tệ.
*   **Giải pháp:** Tích hợp bộ đồng bộ giao dịch Spring (`TransactionSynchronizationManager`). Thay vì xóa giỏ hàng ngay lập tức, hệ thống đăng ký một callback xử lý:
    ```java
    if (TransactionSynchronizationManager.isSynchronizationActive()) {
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                cartService.clearCart(userId);
            }
        });
    }
    ```
    Callback này đảm bảo giỏ hàng trên Redis chỉ thực sự bị dọn trống sau khi giao dịch cơ sở dữ liệu PostgreSQL đã được `commit` thành công 100%.
*   **Đánh đổi (Trade-off):**
    *   *Ưu điểm:* Bảo đảm an toàn tuyệt đối cho giỏ hàng của khách hàng trước mọi lỗi hệ thống đột ngột.
    *   *Nhược điểm:* Đoài hỏi mã nguồn phụ thuộc vào API quản lý giao dịch của Spring, tăng độ phức tạp nhẹ khi viết unit test (cần mock hoặc kích hoạt môi trường transaction thực sự).

### 3. Tối Ưu Hiệu Năng Giỏ Hàng & Khắc Phục Lỗi N+1 Queries (Anti-N+1 Query Pattern in Redis Cart Service)
*   **Vấn đề:** Giỏ hàng lưu trữ thông tin trên Redis dưới dạng Hash `cart:{userId}` với cấu trúc `productId -> quantity` nhằm tăng tốc độ đọc ghi. Tuy nhiên, khi người dùng xem giỏ hàng, hệ thống cần hiển thị thông tin đầy đủ của sản phẩm (Tên, giá bán thực tế, ảnh đại diện). Nếu truy vấn từng sản phẩm riêng lẻ trong cơ sở dữ liệu qua một vòng lặp sẽ gây ra vấn đề N+1 queries, làm tắc nghẽn connection pool của PostgreSQL.
*   **Giải pháp:** Ở lớp `CartServiceImpl.getCart()`, trước hết nạp toàn bộ key-value giỏ hàng từ Redis. Gom toàn bộ danh sách `productIds` lại rồi thực hiện một câu truy vấn lô (batch fetch) duy nhất sử dụng JPQL tùy biến kết hợp FETCH JOIN để lấy thông tin sản phẩm và album hình ảnh liên kết trong một lần kết nối duy nhất:
    ```java
    @Query("SELECT DISTINCT p FROM Product p LEFT JOIN FETCH p.images WHERE p.id IN :ids")
    List<Product> findAllByIdsWithImages(@Param("ids") List<Long> ids);
    ```
*   **Đánh đổi (Trade-off):**
    *   *Ưu điểm:* Giảm số lượng truy vấn xuống tối thiểu (chỉ đúng 1 query DB bất kể giỏ hàng có bao nhiêu sản phẩm), tối ưu thời gian phản hồi API giỏ hàng < 10ms.
    *   *Nhược điểm:* Việc nạp toàn bộ danh sách sản phẩm cùng lúc vào bộ nhớ JVM (Heap memory) sẽ tốn dung lượng RAM hơn một chút, nhưng không đáng kể với kích thước giỏ hàng thông thường.

### 4. Kiểm Soát Vòng Đời Đơn Hàng & Tự Động Hoàn Kho Tồn (State Machine Order Lifecycle & Auto Stock Reversal)
*   **Vấn đề:** Trạng thái đơn hàng cần tuân thủ một quy trình nghiêm ngặt để tránh lỗi thất thoát hàng hóa hoặc gian lận trạng thái thanh toán. Ví dụ, đơn hàng không được phép nhảy trực tiếp từ `PENDING` lên `DELIVERED` mà không qua xác nhận và giao hàng. Hơn nữa, khi đơn hàng bị hủy bởi Khách hàng hoặc Admin, số lượng sản phẩm tương ứng đã trừ kho trước đó phải được cộng trả lại một cách chính xác.
*   **Giải pháp:** Thiết lập máy trạng thái (State Machine) đơn giản ngay bên trong enum `OrderStatus` với phương thức kiểm tra chuyển đổi hợp lệ `isValidTransitionTo()`. Trong luồng xử lý cập nhật trạng thái tại `OrderServiceImpl`, nếu đơn chuyển đổi sang `CANCELLED`, hệ thống sẽ duyệt qua danh sách `OrderItem` để thực hiện hoàn kho (`stockQuantity = stockQuantity + itemQuantity`) cho từng sản phẩm và lưu lại DB.
*   **Đánh đổi (Trade-off):**
    *   *Ưu điểm:* Quy trình đơn hàng chặt chẽ, tự động hóa cập nhật tồn kho chính xác, giảm thiểu sai số kho hàng.
    *   *Nhược điểm:* Cơ chế chuyển đổi cứng nhắc đôi khi gây bất tiện cho admin nếu họ vô tình ấn nhầm trạng thái thực tế. Tuy nhiên, tính toàn vẹn dữ liệu được ưu tiên cao hơn.

### 5. Aspect-Oriented Programming (AOP) Audit Logging & Masking Thông Tin Nhạy Cảm (Security-Aware Auditing)
*   **Vấn đề:** Để tuân thủ quy tắc lưu vết hoạt động (audit logs) cho các hành vi nhạy cảm (Tạo/Cập nhật/Xóa Sản phẩm, Đơn hàng, Đăng nhập), hệ thống cần ghi lại đối số (arguments) của phương thức. Tuy nhiên, nếu lưu trực tiếp, các thông tin bảo mật như mật khẩu người dùng trong payload `RegisterRequest` hay `LoginRequest` sẽ bị lộ dưới dạng văn bản rõ (cleartext) trong bảng nhật ký DB. Hơn nữa, khi người dùng thực hiện đăng nhập hoặc đăng ký, `SecurityContextHolder` chưa được thiết lập nên không thể lấy trực tiếp thông tin người thực hiện (actor).
*   **Giải pháp:** Xây dựng `AuditLogAspect` sử dụng Spring AOP chặn xung quanh các phương thức đánh dấu `@Auditable`. 
    *   *Bảo mật:* Triển khai thuật toán đệ quy duyệt qua các thuộc tính của đối số để tìm các khóa có tên chứa từ `"password"`, tự động che dấu thành `"[MASKED]"` trước khi tuần tự hóa thành chuỗi JSONB lưu vào database.
    *   *Xác định Actor:* Nếu context bảo mật trống, aspect sẽ phân tích đối số của hàm đầu vào để trích xuất email của người dùng từ yêu cầu đăng nhập/đăng ký, sau đó truy vấn DB để điền ID và vai trò của họ vào log.
*   **Đánh đổi (Trade-off):**
    *   *Ưu điểm:* Tách biệt hoàn toàn code logic và code logging (separation of concerns), bảo vệ an toàn thông tin mật khẩu khách hàng.
    *   *Nhược điểm:* Phép phân tích phản xạ (Reflection) và đệ quy duyệt JSON tăng nhẹ độ trễ xử lý CPU của server trong mỗi request nhạy cảm.

### 6. Ràng Buộc Toàn Vẹn Danh Mục Với Sản Phẩm Xóa Mềm (Bypass `@SQLRestriction` for Referential Integrity)
*   **Vấn đề:** Lớp thực thể sản phẩm áp dụng bộ lọc xóa mềm tự động `@SQLRestriction("deleted_at IS NULL")` của Hibernate. Khi thực hiện xóa danh mục, hệ thống cần kiểm tra xem danh mục đó còn sản phẩm nào không qua JPA query thông thường. Tuy nhiên, bộ lọc của Hibernate sẽ tự động bỏ qua các sản phẩm đã bị xóa mềm, dẫn đến kết quả trả về là danh mục rỗng. Khi admin thực hiện xóa danh mục, PostgreSQL sẽ ném ra ngoại lệ ràng buộc khóa ngoại (Foreign Key Violation) do các bản ghi sản phẩm xóa mềm vẫn đang liên kết trực tiếp tới ID danh mục này trong database.
*   **Giải pháp:** Khai báo một truy vấn Native SQL thuần túy trong `ProductRepository` để bỏ qua hoàn toàn bộ lọc tự động tầng JPA của Hibernate:
    ```java
    @Query(value = "SELECT COUNT(*) > 0 FROM products WHERE category_id = :categoryId", nativeQuery = true)
    boolean existsByCategoryId(@Param("categoryId") Long categoryId);
    ```
    Hàm này đếm chính xác số dòng sản phẩm thực tế trong DB (bao gồm cả sản phẩm đang hiển thị và sản phẩm đã bị xóa mềm) để đưa ra cảnh báo ngăn chặn xóa danh mục hợp lý.
*   **Đánh đổi (Trade-off):**
    *   *Ưu điểm:* Đảm bảo cơ sở dữ liệu PostgreSQL không bao giờ rơi vào trạng thái lỗi ràng buộc khóa ngoại không được kiểm soát.
    *   *Nhược điểm:* Việc viết Native SQL làm giảm tính độc lập với hệ quản trị cơ sở dữ liệu của JPA (nhưng không thành vấn đề vì hệ thống chỉ định rõ PostgreSQL làm DB duy nhất).

### 7. Đồng Bộ Lọc Và Phân Trang Tránh Vòng Lặp Reload Trên Frontend Next.js (Pagination & Filter Synchronization)
*   **Vấn đề:** Trên trang danh sách sản phẩm khách hàng (`/products`), các bộ lọc (Danh mục, khoảng giá, từ khóa tìm kiếm) và tham số phân trang (`page`) ban đầu được đồng bộ hoàn toàn qua URL query parameters. Khi khách hàng đang xem ở trang `2` của một danh mục nhiều sản phẩm, sau đó họ đổi sang một danh mục khác chỉ có đúng `1` trang sản phẩm. Lúc này, URL vẫn giữ nguyên tham số `page=2`, dẫn đến màn hình hiển thị danh sách trống trơn do không có sản phẩm nào ở trang 2 của danh mục mới.
*   **Giải pháp:** Tách biệt state phân trang cục bộ bằng React local state (`useState`). Khi bất kỳ bộ lọc nào (Danh mục, Khoảng giá, Từ khóa) thay đổi, hệ thống sẽ bắt sự kiện và tự động reset trang cục bộ về `1` trước. Sau khi dữ liệu mới được tải về, state này mới được đồng bộ âm thầm lên URL query params bằng `router.replace` có cấu hình `scroll: false` để tránh việc trình duyệt bị load lại và giật màn hình.
*   **Đánh đổi (Trade-off):**
    *   *Ưu điểm:* Giao diện phản hồi tức thì, không bị chớp giật trình duyệt, ngăn chặn hoàn toàn lỗi trang trống khi đổi bộ lọc từ trang thứ 2.
    *   *Nhược điểm:* Logic xử lý phức tạp hơn ở Client Component do phải đồng bộ thủ công giữa local state và query string trong URL.

### 8. Kiến Trúc Bảo Mật Stateless JWT Tối Giản (Stateless JWT Security Architecture)
*   **Vấn đề:** Các hệ thống e-commerce thường yêu cầu bảo mật phiên đăng nhập của người dùng. Việc thiết lập cơ chế Session-Stateful trên DB hoặc cơ chế Refresh Token phức tạp làm tăng đáng kể số lượng truy vấn DB và làm phức tạp hóa luồng Authentication.
*   **Giải pháp:** Sử dụng kiến trúc bảo mật hoàn toàn Stateless JWT. Khi đăng nhập thành công, Server phát hành một Access Token duy nhất có thời hạn hiệu lực dài (7 ngày) được ký bằng thuật toán bí mật HMAC. Mọi yêu cầu tiếp theo từ Client chỉ cần đính token này vào tiêu đề `Authorization: Bearer <token>`, filter Security sẽ tự động giải mã và xác thực trực tiếp trên bộ nhớ mà không cần truy cập Database.
*   **Đánh đổi (Trade-off):**
    *   *Ưu điểm:* Hiệu năng xác thực cực cao, server hoàn toàn stateless giúp dễ dàng triển khai nhân bản trong tương lai.
    *   *Nhược điểm:* Không thể chủ động thu hồi (revoke) token trước thời hạn 7 ngày từ phía server (đăng xuất chỉ đơn thuần là xóa token ở client). Tuy nhiên, đây là sự đánh đổi hoàn toàn hợp lý đối với quy mô MVP của dự án.

### 9. Quản Lý Đa Phương Tiện Với Cloud Storage (Cloudinary Integration)
*   **Vấn đề:** Lưu trữ trực tiếp ảnh sản phẩm tải lên vào thư mục cục bộ của VPS (`/uploads`) làm phình to dung lượng ổ đĩa của server ứng dụng nhanh chóng, gây khó khăn khi sao lưu dữ liệu và làm chậm tốc độ tải trang do VPS phải gánh thêm tác vụ truyền tải tài nguyên tĩnh (static assets).
*   **Giải pháp:** Tích hợp trực tiếp Cloudinary Java SDK vào backend. Khi Admin thêm/sửa sản phẩm kèm theo hình ảnh (Multipart-form), backend sẽ nhận file, truyền trực tiếp lên dịch vụ lưu trữ đám mây Cloudinary thông qua API bảo mật, nhận lại URL ảnh CDN đã được tối ưu hóa dung lượng/kích thước và lưu URL này vào PostgreSQL.
*   **Đánh đổi (Trade-off):**
    *   *Ưu điểm:* Tiết kiệm tài nguyên VPS ứng dụng, tăng tốc độ tải ảnh nhờ mạng lưới phân phối CDN toàn cầu của Cloudinary.
    *   *Nhược điểm:* Thêm phụ thuộc mạng bên ngoài (external network call) trong quá trình thêm/sửa sản phẩm. Nếu Cloudinary gặp sự cố, luồng cập nhật sản phẩm sẽ bị gián đoạn tạm thời.

### 10. Tái Cấu Trúc Hệ Thống Package Backend Theo Module (Modular Package Restructuring)
*   **Vấn đề:** Cấu trúc dự án ban đầu thiết kế phẳng (flat packages), dẫn đến việc có hàng chục file Controllers, Services, DTOs nằm chung một thư mục. Khi dự án phát triển thêm tính năng mới, việc tìm kiếm mã nguồn và kiểm soát ranh giới nghiệp vụ (domain boundaries) trở nên cực kỳ khó khăn.
*   **Giải pháp:** Tái cấu trúc toàn bộ mã nguồn backend thành cấu trúc dạng Domain-driven packages. Nhóm tất cả các lớp liên quan đến một miền nghiệp vụ cụ thể (như `auth`, `product`, `order`, `user`, `category`, `cart`, `dashboard`) vào trong sub-package tương ứng.
*   **Đánh đổi (Trade-off):**
    *   *Ưu điểm:* Cấu trúc thư mục sạch sẽ, trực quan, dễ bảo trì và phân công công việc phát triển độc lập theo tính năng.
    *   *Nhược điểm:* Yêu cầu cập nhật thủ công hàng trăm dòng import và điều chỉnh các định cấu hình bảo mật/JPA scan trong dự án Spring Boot.

---

---

## 🔌 Tóm Tắt Các Endpoint REST API cốt lõi

Tất cả các API được thiết kế theo chuẩn RESTful, sử dụng tiền tố `/api/v1/` và bọc phản hồi dưới dạng chuẩn dữ liệu chung.

| Nhóm chức năng | Phương thức | URL API | Quyền hạn | Mô tả chi tiết |
| :--- | :--- | :--- | :--- | :--- |
| **Xác thực** | `POST` | `/api/v1/auth/register` | Công khai | Đăng ký tài khoản khách hàng mới |
| | `POST` | `/api/v1/auth/login` | Công khai | Đăng nhập hệ thống và nhận JWT Access Token |
| | `POST` | `/api/v1/auth/logout` | Đã Đăng Nhập | Đăng xuất tài khoản và ghi vết Audit Log |
| **Sản phẩm** | `GET` | `/api/v1/products` | Công khai | Lấy danh sách sản phẩm phân trang & bộ lọc |
| | `GET` | `/api/v1/products/{id}` | Công khai | Xem chi tiết thông tin một sản phẩm |
| **Giỏ hàng** | `GET` | `/api/v1/cart` | Khách hàng/Admin| Lấy danh sách sản phẩm trong giỏ (từ Redis) |
| | `POST` | `/api/v1/cart/items` | Khách hàng/Admin| Thêm sản phẩm vào giỏ hàng |
| | `PUT` | `/api/v1/cart/items/{productId}` | Khách hàng/Admin| Cập nhật số lượng sản phẩm trong giỏ hàng |
| | `DELETE`| `/api/v1/cart/items/{productId}` | Khách hàng/Admin| Xóa sản phẩm khỏi giỏ hàng |
| **Đơn hàng** | `POST` | `/api/v1/orders` | Khách hàng/Admin| Tiến hành đặt hàng từ giỏ hàng hiện tại |
| | `GET` | `/api/v1/orders` | Khách hàng/Admin| Xem lịch sử đặt hàng của cá nhân |
| | `PATCH`| `/api/v1/orders/{id}/cancel` | Khách hàng/Admin| Hủy đơn hàng (Chỉ khi đơn ở trạng thái `PENDING`) |
| **Quản trị Admin** | `GET` | `/api/v1/admin/dashboard/kpi` | Chỉ Admin | Lấy các số liệu KPI phục vụ thống kê |
| | `GET` | `/api/v1/admin/dashboard/revenue` | Chỉ Admin | Lấy doanh thu phục vụ vẽ biểu đồ Recharts |
| | `POST` | `/api/v1/admin/products` | Chỉ Admin | Tạo mới sản phẩm (Hỗ trợ upload ảnh Cloudinary) |
| | `PUT` | `/api/v1/admin/products/{id}`| Chỉ Admin | Cập nhật thông tin chi tiết sản phẩm |
| | `DELETE`| `/api/v1/admin/products/{id}`| Chỉ Admin | Xóa mềm sản phẩm khỏi hệ thống |
| | `PATCH`| `/api/v1/admin/orders/{id}/status` | Chỉ Admin | Cập nhật trạng thái đơn (State Machine transition) |
| | `GET` | `/api/v1/admin/users` | Chỉ Admin | Xem danh sách toàn bộ tài khoản người dùng |
| | `PATCH`| `/api/v1/admin/users/{id}/roles` | Chỉ Admin | Thay đổi phân quyền tài khoản người dùng |

---

## ⚙️ Hướng Dẫn Cài Đặt & Chạy Ứng Dụng Dưới Local

### Yêu cầu hệ thống tối thiểu
*   **Java 21** (JDK 21) trở lên.
*   **Node.js 20** trở lên.
*   **Docker** & **Docker Compose** đã khởi chạy.
*   **Git** để lấy mã nguồn.

### Bước 1: Tải mã nguồn dự án
```bash
git clone https://github.com/Hoangjunss/app_7eleven.git
cd app_7eleven
```

### Bước 2: Thiết lập file môi trường
Tạo file cấu hình môi trường `.env.prod` tại thư mục gốc của dự án bằng cách sao chép từ file mẫu:
```bash
cp .env.prod.example .env.prod
```
Sau đó mở file `.env.prod` lên và điền các thông tin bảo mật thực tế của bạn:
*   `JWT_SECRET`: Khóa ký token JWT (nên chọn chuỗi ngẫu nhiên dài hơn 32 ký tự).
*   `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: Thông tin API Cloudinary của bạn để upload ảnh sản phẩm.

### Bước 3: Khởi chạy ứng dụng bằng Docker Compose
Chạy lệnh duy nhất sau tại thư mục gốc để Docker tự động tải ảnh, build mã nguồn và khởi chạy toàn bộ 5 container (`backend`, `frontend`, `postgres`, `redis`, `nginx`):
```bash
docker compose up --build -d
```
Sau khi các container ở trạng thái `healthy`, bạn có thể truy cập local:
*   Trang mua sắm khách hàng: `http://localhost:3000`
*   REST API Backend: `http://localhost:8080`

---

## 🧪 Chạy Kiểm Thử Tự Động (Testing Suite)

### Backend (Spring Boot Test)
Mã nguồn backend đi kèm với bộ test suite tự động gồm **142 bài test** kiểm thử toàn diện các luồng Controller, logic Service, Spring Security, Mapper và xử lý ngoại lệ.
Để thực thi bộ test:
```bash
cd backend
mvn clean test
```
*Kết quả:* **142/142 tests thành công 100%**.

### Frontend (Next.js Test)
Để kiểm thử giao diện React components:
```bash
cd frontend
npm run test
```

---

## 🛑 Những Hạn Chế Hiện Tại & Lộ Trình Phase 2

### Hạn chế ở giai đoạn MVP (Phase 1)
*   **Thanh toán:** Hệ thống mới chỉ hỗ trợ COD (Thanh toán bằng tiền mặt khi giao hàng).
*   **Thông báo:** Chưa tích hợp gửi email xác nhận giao dịch tự động đến khách hàng do giới hạn không được dùng thư viện mail hoặc RabbitMQ trong MVP.
*   **Tìm kiếm nâng cao:** Các truy vấn tìm kiếm sản phẩm vẫn sử dụng SQL `ILIKE` ở DB, chưa có cơ chế gợi ý từ khóa thông minh (Elasticsearch).

### Kế hoạch phát triển Phase 2 (Khi được phép mở rộng)
1.  **Cổng thanh toán online:** Tích hợp SDK thanh toán VNPAY, MoMo hoặc ZaloPay vào luồng checkout.
2.  **Thông báo đa kênh:** Cấu hình RabbitMQ/Kafka để xử lý bất đồng bộ việc gửi mail hóa đơn và đẩy thông báo đẩy (Web Push) thời gian thực đến admin khi có đơn hàng mới.
3.  **Bộ lọc tìm kiếm thông minh:** Triển khai Elasticsearch để đánh chỉ mục sản phẩm và hỗ trợ tìm kiếm mờ (fuzzy search), gợi ý tự động (autocomplete).
