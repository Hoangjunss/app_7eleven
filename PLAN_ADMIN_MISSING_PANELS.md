# Kế Hoạch Bổ Sung Màn Hình Quản Lý Admin (Sản Phẩm, Danh Mục, Người Dùng)

Kế hoạch này chi tiết việc triển khai các màn hình quản lý admin còn thiếu trên Frontend (Next.js) và bổ sung các API cần thiết trên Backend (Spring Boot) cho việc quản lý người dùng (User Management).

---

## 1. Tổng Quan Thời Gian Dự Kiến
* **Tổng thời gian dự kiến:** 4 - 6 giờ.
* **Mức độ phức tạp:** Trung bình (CRUD Frontend kết hợp tích hợp Cloudinary upload và mở rộng API Admin).

---

## 2. Git Setup
```bash
git checkout develop
git pull origin develop
git checkout -b feature/admin-missing-panels
```
*Commit convention:* `<type>(admin): <subject>` (ví dụ: `feat(admin): add category CRUD panel`)

---

## 3. Danh Sách Tasks

### Task 1: Màn hình Quản lý Sản phẩm (Admin Product Management)
- **Mô tả:** 
  - Tạo trang `/admin/products` quản lý danh sách sản phẩm.
  - Hiển thị bảng sản phẩm có phân trang, tìm kiếm theo tên, và bộ lọc theo danh mục.
  - Form thêm mới và chỉnh sửa sản phẩm: hỗ trợ chọn danh mục, nhập số lượng kho, giá bán và tải lên nhiều hình ảnh (gửi multipart request kèm upload ảnh qua Cloudinary).
  - Tích hợp nút Xóa sản phẩm (soft-delete ở backend).
- **Mã nguồn cần tác động:**
  - Tạo `frontend/src/app/admin/products/page.tsx`
  - Tạo service/hook: `frontend/src/services/adminProductService.ts`, `frontend/src/hooks/useAdminProducts.ts`
- **Git Commit:** `feat(admin): implement product management CRUD panel with image upload`

---

### Task 2: Màn hình Quản lý Danh mục (Admin Category Management)
- **Mô tả:**
  - Tạo trang `/admin/categories` quản lý danh mục sản phẩm.
  - Hiển thị bảng danh mục, hỗ trợ tìm kiếm và phân trang.
  - Tích hợp Dialog/Form để thêm mới và cập nhật tên, mô tả của danh mục.
  - Tích hợp tính năng xóa danh mục (hiển thị Dialog xác nhận trước khi xóa).
- **Mã nguồn cần tác động:**
  - Tạo `frontend/src/app/admin/categories/page.tsx`
  - Tạo service/hook: `frontend/src/services/adminCategoryService.ts`, `frontend/src/hooks/useAdminCategories.ts`
- **Git Commit:** `feat(admin): implement category CRUD management panel`

---

### Task 3: Bổ sung API Quản lý Người dùng trên Backend (Spring Boot)
- **Mô tả:**
  - Backend hiện tại chưa có các endpoint CRUD cho người dùng từ phía Admin. Cần tạo `AdminUserController` được bảo vệ bởi `@PreAuthorize("hasRole('ADMIN')")`.
  - Hỗ trợ các API:
    - `GET /api/v1/admin/users`: Lấy danh sách users (phân trang, tìm kiếm theo email/name).
    - `PATCH /api/v1/admin/users/{id}/roles`: Cập nhật vai trò (gán role USER/ADMIN).
    - `DELETE /api/v1/admin/users/{id}`: Khóa tài khoản (soft delete user).
    - `PATCH /api/v1/admin/users/{id}/restore`: Mở khóa tài khoản (khôi phục user đã soft delete).
- **Mã nguồn cần tác động:**
  - Tạo `backend/src/main/java/com/_eleven/shop/controller/admin/AdminUserController.java`
  - Bổ sung logic trong `UserService` và `UserRepository` (native query để tìm kiếm bao gồm cả các user đã bị soft delete).
- **Git Commit:** `feat(backend): add admin user management REST endpoints`

---

### Task 4: Màn hình Quản lý Người dùng (Admin User Management)
- **Mô tả:**
  - Tạo trang `/admin/users` hiển thị danh sách người dùng trong hệ thống.
  - Hỗ trợ tìm kiếm theo email/tên, phân trang và hiển thị vai trò (badges).
  - Tích hợp hành động:
    - Thay đổi vai trò (USER <-> ADMIN) thông qua Select/Dropdown.
    - Khóa (Block/Soft Delete) hoặc Mở khóa (Restore) tài khoản người dùng kèm Dialog xác nhận.
- **Mã nguồn cần tác động:**
  - Tạo `frontend/src/app/admin/users/page.tsx`
  - Tạo service/hook: `frontend/src/services/adminUserService.ts`, `frontend/src/hooks/useAdminUsers.ts`
- **Git Commit:** `feat(admin): implement user management and role assignment panel`

---

### Task 5: Tích hợp Menu và Phân quyền Điều hướng (Navigation & Layout)
- **Mô tả:**
  - Cập nhật Sidebar Admin (`AdminSidebar.tsx`) hiển thị đầy đủ các link:
    - Quản lý Đơn hàng (`/admin/orders`)
    - Quản lý Sản phẩm (`/admin/products`)
    - Quản lý Danh mục (`/admin/categories`)
    - Quản lý Người dùng (`/admin/users`)
  - Đảm bảo tất cả các route bắt đầu bằng `/admin/**` đều được bảo vệ nghiêm ngặt bằng route guard `ProtectedRoute`, chuyển hướng về trang chủ `/` kèm thông báo Toast cảnh báo nếu tài khoản đăng nhập không phải ADMIN.
- **Mã nguồn cần tác động:**
  - Chỉnh sửa `frontend/src/components/layout/AdminSidebar.tsx`
  - Cập nhật kiểm tra quyền trong các route `/admin/`
- **Git Commit:** `feat(admin): integrate sidebar navigation and secure routing guards`

---

## 4. Chi Tiết Bản Phác Thảo Giao Diện (UI Sketch & Ux flow)

### 4.1 Quản lý Sản phẩm (Admin Products)
```
+-------------------------------------------------------------------+
|  [Admin Sidebar]  |  Quản lý Sản phẩm                 [+ Thêm mới]  |
|                   |  [Tìm kiếm...] [Lọc danh mục v]                |
|                   +-----------------------------------------------+
|                   | Ảnh | Tên        | Giá      | Kho | Hành động |
|                   |-----+------------+----------+-----+-----------|
|                   | [x] | Pepsi 320ml| 10,000đ  | 100 | [Sửa] [Xóa]|
|                   +-----------------------------------------------+
|                   |                       [ Trang: < 1 (2) 3 > ]  |
+-------------------------------------------------------------------+
```
* **Modal Thêm/Sửa Sản phẩm:** Form đa bước/tab hoặc grid chia đôi. Bên trái nhập thông tin text, bên phải là khu vực Drag & Drop Upload ảnh. Ảnh tải lên có thể chọn ảnh chính (Primary index).

### 4.2 Quản lý Người dùng (Admin Users)
```
+-------------------------------------------------------------------+
|  [Admin Sidebar]  |  Quản lý Thành viên                           |
|                   |  [Tìm kiếm email...]                           |
|                   +-----------------------------------------------+
|                   | ID | Email           | Họ Tên  | Quyền | Khóa |
|                   |----+-----------------+---------+-------+------|
|                   | 1  | admin@test.com  | Admin A | [ADMIN|v] [ ]  |
|                   | 2  | buyer@test.com  | Buyer B | [USER |v] [x]  |
+-------------------------------------------------------------------+
```

---

## 5. Hướng Dẫn Kiểm Tra & Xác Minh (Verification Checklist)

### 5.1 Kiểm tra Sản phẩm & Danh mục (CRUD):
- [ ] Truy cập `/admin/products`, tạo mới một sản phẩm có đính kèm file ảnh thực tế. Xác minh ảnh được lưu trên Cloudinary và hiển thị chính xác.
- [ ] Chỉnh sửa sản phẩm, thay đổi giá, đổi ảnh chính và lưu lại.
- [ ] Thử xóa sản phẩm và xác minh sản phẩm không còn hiển thị ở màn Public.
- [ ] Tạo mới, sửa và xóa danh mục tại `/admin/categories`.

### 5.2 Kiểm tra Quản lý Người dùng (CD / Admin User):
- [ ] Đăng nhập tài khoản ADMIN, truy cập `/admin/users` xem danh sách người dùng.
- [ ] Chuyển đổi role của một USER thành ADMIN, đăng xuất rồi đăng nhập lại bằng tài khoản đó để kiểm tra quyền truy cập admin.
- [ ] Thực hiện Khóa (Block) một user. Thử dùng user đó đăng nhập lại, hệ thống phải từ chối (trả về 401/403). Mở khóa (Restore) user đó và đăng nhập lại bình thường.

### 5.3 Bảo mật Điều hướng (Security Guards):
- [ ] Đăng nhập tài khoản thường (ROLE_USER), thử gõ trực tiếp URL `/admin/products`. Hệ thống phải chặn và đá về trang chủ `/` kèm Toast thông báo từ chối quyền.
- [ ] Thử truy cập khi chưa đăng nhập (Anonymous), hệ thống đá về `/login`.

---

## 6. Pull Request Mẫu (PR Template)
```markdown
## Mô tả (Description)
Bổ sung các bảng điều khiển Admin còn thiếu (Sản phẩm, Danh mục, Thành viên) trên Frontend và cung cấp API quản lý thành viên trên Backend để hoàn thiện tính năng quản trị MVP.

## Các thay đổi chính (Key Changes)
- **Backend:**
  - Thêm `AdminUserController` thực hiện phân trang, phân vai trò, khóa và mở khóa tài khoản.
- **Frontend:**
  - Triển khai CRUD sản phẩm có tích hợp upload đa ảnh qua Cloudinary.
  - Triển khai CRUD danh mục dạng Dialog/Table.
  - Triển khai danh sách thành viên, cập nhật quyền trực tiếp và khóa/mở khóa tài khoản.
  - Thêm đầy đủ liên kết điều hướng vào `AdminSidebar.tsx` và thắt chặt kiểm tra quyền.

## Kết quả tự kiểm tra (Verification Results)
- Đăng nhập tài khoản admin test thử CRUD sản phẩm thành công.
- Các route `/admin/**` được bảo vệ hoàn toàn khỏi các tài khoản ROLE_USER.
```
