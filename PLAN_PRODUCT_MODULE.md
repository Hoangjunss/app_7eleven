# PLAN_PRODUCT_MODULE.md

## Tổng quan
- Tổng số phase: 4
- Tổng thời gian dự kiến: 18 giờ

---

## Phase 1: Cơ sở dữ liệu, Danh mục (Category) và Cấu hình Cloudinary
**Mục tiêu:** Thiết lập migration database (Flyway), triển khai tính năng CRUD Danh mục (Category) phục vụ quản trị và hiển thị, và tích hợp thư viện/cấu hình Cloudinary làm lưu trữ đám mây cho ảnh.  
**Thời gian:** 5 giờ  

**Tasks:**
- [ ] Task 1: Tạo file migration Flyway:
  - `V3__create_product_and_category_tables.sql` thiết lập các bảng `categories`, `products`, `product_images` và trigger cập nhật `updated_at`.
  - `V4__add_pg_trgm_index.sql` kích hoạt extension `pg_trgm` (nếu chưa có) và thiết lập index GIN phục vụ tìm kiếm nhanh không dấu/có dấu theo tên sản phẩm.
- [ ] Task 2: Khai báo JPA Entity và Repository tương ứng cho `Category` hỗ trợ soft delete (cột `deleted_at`).
- [ ] Task 3: Triển khai DTOs (`CategoryRequest`, `CategoryResponse`), Mapper (MapStruct), và logic xử lý nghiệp vụ cho Category:
  - Admin CRUD: `POST`, `PUT`, `DELETE` tại `/api/v1/admin/categories`
  - Public API: `GET` danh sách danh mục tại `/api/v1/categories`
- [ ] Task 4: Tích hợp thư viện Cloudinary:
  - Thêm dependency `com.cloudinary:cloudinary-http5` (hoặc bản mới nhất) vào `pom.xml`.
  - Cấu hình `CloudinaryConfig` bean đọc các tham số môi trường: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` từ cấu hình Spring (không hardcode API key).
  - Triển khai `CloudinaryStorageService` cung cấp phương thức `uploadFile(MultipartFile file, String folder)` trả về URL công khai.

**Commit messages gợi ý:**
- `db(migration): create schema for categories, products, product_images`
- `db(migration): enable pg_trgm and add GIN index on product name`
- `feat(category): add JPA entity and repository for Category`
- `feat(category): implement CRUD API and MapStruct mapper for Category`
- `feat(storage): configure Cloudinary storage service and dependencies`

---

## Phase 2: Nghiệp vụ Sản phẩm (Product) & Ảnh sản phẩm (Cloudinary)
**Mục tiêu:** Xây dựng cấu trúc dữ liệu cho Sản phẩm và Ảnh sản phẩm hỗ trợ soft delete, triển khai API CRUD sản phẩm dành cho Admin, tích hợp ghi Audit Log tự động, cơ chế upload nhiều ảnh trực tiếp lên Cloudinary.  
**Thời gian:** 6 giờ  

**Tasks:**
- [ ] Task 1: Khai báo JPA Entity và Repository cho `Product` và `ProductImage` (quan hệ 1-N với `Product`):
  - Cột `deleted_at TIMESTAMPTZ` dùng cho soft delete.
  - Sử dụng annotation `@SQLRestriction("deleted_at IS NULL")` (hoặc `@Where(clause = "deleted_at IS NULL")`) trên `Product` và `ProductImage` để tự động lọc bỏ các bản ghi đã xóa.
  - Tích hợp `@Version` trên trường `version` phục vụ optimistic lock cột `stock_quantity`.
- [ ] Task 2: Triển khai DTOs (`ProductRequest`, `ProductResponse`, `ProductImageResponse`) và MapStruct Mapper tương ứng.
- [ ] Task 3: Triển khai API CRUD sản phẩm dành cho Admin tại `/api/v1/admin/products` tích hợp annotation `@Auditable` (loại hành động: `CREATE_PRODUCT`, `UPDATE_PRODUCT`, `DELETE_PRODUCT`).
- [ ] Task 4: Triển khai logic upload nhiều ảnh cho sản phẩm: gọi `CloudinaryStorageService.uploadFile` để đẩy ảnh lên đám mây, tự động lấy URL công khai do Cloudinary trả về lưu vào bảng `product_images`, và gắn cờ ảnh đại diện (Primary Image).
- [ ] Task 5: Triển khai cơ chế dọn dẹp trên Cloudinary (nếu cần/tùy chọn) hoặc xóa các bản ghi ảnh tương ứng trong cơ sở dữ liệu khi cập nhật ảnh đại diện mới hoặc xóa ảnh riêng lẻ khỏi sản phẩm.

**Commit messages gợi ý:**
- `feat(product): add JPA entities and repositories with soft delete and optimistic lock`
- `feat(product): implement request response DTOs and MapStruct mapper`
- `feat(product): implement admin CRUD APIs with @Auditable logging`
- `feat(product): implement multiple image upload directly to Cloudinary`

---

## Phase 3: Hiển thị sản phẩm cho User (Public API)
**Mục tiêu:** Phát triển API công khai cho người dùng cuối (User) để xem chi tiết sản phẩm và xem danh sách sản phẩm kết hợp tìm kiếm, phân trang và bộ lọc nâng cao.  
**Thời gian:** 4 giờ  

**Tasks:**
- [ ] Task 1: Xây dựng cấu trúc query động (Specification hoặc JPQL) tìm kiếm sản phẩm theo tên sử dụng toán tử `ILIKE` kết hợp các bộ lọc: theo `category_id`, khoảng giá (`min_price`, `max_price`), và phân trang theo `Pageable`.
- [ ] Task 2: Triển khai Public API lấy danh sách sản phẩm `/api/v1/products` hỗ trợ phân trang nhận các tham số: `page` (mặc định 0), `size` (mặc định 20), `sortBy` (mặc định `createdAt`). Trả về response dạng phân trang chứa thông tin cơ bản và URL ảnh đại diện trên Cloudinary của sản phẩm.
- [ ] Task 3: Triển khai Public API lấy chi tiết sản phẩm `/api/v1/products/{id}` hiển thị đầy đủ thông tin mô tả, danh mục, và tất cả danh sách ảnh (URL Cloudinary) đi kèm của sản phẩm.

**Commit messages gợi ý:**
- `feat(product): implement dynamic query for pagination search and filter`
- `feat(product): implement public list products API with pagination params`
- `feat(product): implement public get product details API`

---

## Phase 4: Kiểm thử và Tích hợp (Testing)
**Mục tiêu:** Viết kiểm thử tự động xác thực phân quyền API, tranh chấp tồn kho và kiểm thử thủ công tích hợp luồng sản phẩm hoàn chỉnh cùng với audit log và xác thực upload ảnh lên đám mây Cloudinary.  
**Thời gian:** 3 giờ  

**Tasks:**
- [ ] Task 1: Viết integration tests xác thực quyền truy cập API: Đảm bảo chỉ có tài khoản Admin mới gọi được API CRUD Category/Product, còn User thường bị chặn (`403 Forbidden`).
- [ ] Task 2: Viết test cases kiểm chứng cơ chế Optimistic Locking: Giả lập 2 transaction cùng cập nhật số lượng tồn kho `stock_quantity` của sản phẩm đồng thời để xác minh quăng lỗi `ObjectOptimisticLockingFailureException`.
- [ ] Task 3: Thực hiện kiểm thử thủ công quy trình tích hợp: Tạo danh mục $\rightarrow$ Upload ảnh & tạo sản phẩm $\rightarrow$ Tìm kiếm và xem chi tiết sản phẩm ở phía client $\rightarrow$ Cập nhật thông tin và xóa sản phẩm.
  - Xác minh ảnh được tải lên Cloudinary thành công và trả về URL có định dạng `https://res.cloudinary.com/...`.
  - Đảm bảo không có ảnh nào bị lưu trữ cục bộ (local filesystem).
  - Kiểm tra các bản ghi được log tự động trong bảng `audit_logs`.

**Commit messages gợi ý:**
- `test(product): add security integration tests for product and category endpoints`
- `test(product): add concurrency test cases for product optimistic locking`
- `test(product): perform manual verification of Cloudinary uploads and audit logging`
