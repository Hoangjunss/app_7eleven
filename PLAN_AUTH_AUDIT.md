# PLAN_AUTH_AUDIT.md

## Tổng quan
- Tổng số phase: 4 (3 phase phát triển + 1 phase kiểm tra)
- Tổng thời gian dự kiến: 18 giờ

---

## Phase 1: Cấu hình Cơ sở dữ liệu và Spring Security
**Mục tiêu:** Xây dựng cơ sở dữ liệu cho các thực thể người dùng, vai trò và lịch sử hành động; cấu hình phân quyền Security cơ bản và cơ chế mã hóa mật khẩu.  
**Thời gian:** 5 giờ  

**Tasks:**
- [x] Task 1: Tạo file migration Flyway (`V2__Create_auth_and_audit_tables.sql`) thiết lập các bảng `users`, `roles`, `user_roles`, và `audit_logs` (với các cột cần thiết cho audit log như actor_id, ip_address, v.v.).
- [ ] Task 2: Khai báo JPA Entity và các Repository tương ứng (`User`, `Role`, `AuditLog`) hỗ trợ cơ chế lưu trữ và soft delete.
- [ ] Task 3: Tạo lớp cấu hình `SecurityConfig` và định nghĩa `SecurityFilterChain` thiết lập phân quyền:
  - Cho phép truy cập không cần xác thực (`PUBLIC`) cho `/api/v1/auth/**` và `/api/v1/products/**`.
  - Phân quyền `ADMIN` truy cập `/api/v1/admin/**`.
  - Yêu cầu xác thực `AUTHENTICATED` cho tất cả các API còn lại.
- [ ] Task 4: Khai báo bean `PasswordEncoder` sử dụng BCrypt để phục vụ mã hóa mật khẩu người dùng.

**Commit messages gợi ý (khi làm xong từng task):**
- `db(migration): create schema for users, roles and audit logs`
- `feat(entity): add JPA entities and repositories for Auth and Audit Log`
- `feat(security): configure SecurityFilterChain permissions rules`
- `feat(security): configure BCryptPasswordEncoder bean`

---

## Phase 2: Xác thực Người dùng và JWT
**Mục tiêu:** Xây dựng API Đăng ký, Đăng nhập, cấu hình bộ lọc request xác thực bằng token JWT hiệu lực 7 ngày.  
**Thời gian:** 6 giờ  

**Tasks:**
- [ ] Task 1: Triển khai lớp tiện ích `JwtProvider` chịu trách nhiệm tạo token JWT (hết hạn sau 7 ngày), trích xuất thông tin người dùng và xác thực tính hợp lệ của token.
- [ ] Task 2: Tạo bộ lọc `JwtAuthenticationFilter` kế thừa `OncePerRequestFilter` để đánh chặn Authorization header (Bearer token) trên mỗi request.
- [ ] Task 3: Triển khai `CustomUserDetailsService` thực thi nạp dữ liệu người dùng từ cơ sở dữ liệu phục vụ xác thực Security.
- [ ] Task 4: Tạo các DTO trao đổi dữ liệu: `LoginRequest`, `RegisterRequest`, và `AuthResponse`.
- [ ] Task 5: Triển khai `AuthService` và `AuthController` xử lý nghiệp vụ tại các endpoint:
  - `POST /api/v1/auth/register` (đăng ký tài khoản mới)
  - `POST /api/v1/auth/login` (đăng nhập và trả về token JWT)

**Commit messages gợi ý (khi làm xong từng task):**
- `feat(security): implement JwtProvider for JWT token generation and validation`
- `feat(security): implement JwtAuthenticationFilter for Bearer token validation`
- `feat(security): add CustomUserDetailsService for database authentication`
- `feat(auth): create register and login request response DTOs`
- `feat(auth): implement controller and service endpoints for login and register`

---

## Phase 3: Aspect-Oriented Programming (AOP) cho Audit Log
**Mục tiêu:** Định nghĩa annotation `@Auditable` và xây dựng khía cạnh Aspect để tự động ghi log đồng bộ các hành động yêu cầu vào bảng `audit_logs` trong PostgreSQL.  
**Thời gian:** 5 giờ  

**Tasks:**
- [ ] Task 1: Định nghĩa annotation tự chế `@Auditable` (cho phép truyền metadata như loại hành động `action`, thực thể `entity_type`).
- [ ] Task 2: Triển khai `AuditLogService` chịu trách nhiệm lưu thông tin log đồng bộ vào PostgreSQL.
- [ ] Task 3: Tạo class `AuditLogAspect` đánh chặn các phương thức được gán nhãn `@Auditable` để thu thập dữ liệu:
  - Người thực hiện: `actor_id`, `actor_email`, `actor_role` (trích xuất từ Security Context).
  - Chi tiết hành động: `action` (LOGIN_SUCCESS, LOGIN_FAILED, LOGOUT, REGISTER), `ip_address`, `user_agent`, kết quả thực hiện (`SUCCESS` / `FAILED`), và thông báo lỗi nếu có.
- [ ] Task 4: Tích hợp `@Auditable` vào các nghiệp vụ xác thực tương ứng trong hệ thống.

**Commit messages gợi ý (khi làm xong từng task):**
- `feat(audit): define Auditable annotation and implement AuditLogService`
- `feat(audit): create AuditLogAspect using AOP to capture request metadata`
- `feat(auth): apply Auditable annotations to register, login, and logout actions`

---

## Phase kiểm tra và Tích hợp
**Mục tiêu:** Viết kiểm thử tự động và thực hiện kiểm thử thủ công để đảm bảo phân quyền và ghi nhận nhật ký hành động hoạt động chính xác.  
**Thời gian:** 2 giờ  

**Tasks:**
- [ ] Task 1: Viết test cases xác thực phân quyền Security (đảm bảo admin API bị từ chối nếu truy cập bằng tài khoản thường và ngược lại).
- [ ] Task 2: Thực hiện kiểm thử thủ công: Đăng ký thành công $\rightarrow$ Đăng nhập lỗi $\rightarrow$ Đăng nhập đúng $\rightarrow$ Gọi API được bảo mật $\rightarrow$ Đăng xuất. Kiểm tra xem bảng `audit_logs` có lưu đầy đủ các trạng thái `REGISTER`, `LOGIN_FAILED`, `LOGIN_SUCCESS` và `LOGOUT` kèm thông tin IP, User Agent hay không.

**Commit messages gợi ý (khi làm xong từng task):**
- `test(security): add integration tests for api route permissions`
- `test(audit): add tests for AOP logging under success and failure login cases`
