# MVP 5 ngày – Product & Order Management (Monolithic + PostgreSQL + RabbitMQ) – Chỉ thiết kế

> **Phiên bản:** MVP 1.0 | **Team:** 1 người | **Deadline:** 5 ngày | **Mục tiêu:** Chạy được, đủ tính năng, không over-engineer

---

## Mục lục

1. [Triết lý MVP – Cắt gì, giữ gì](#1-triết-lý-mvp)
2. [Bảng so sánh MVP vs Phase 2](#2-bảng-so-sánh-mvp-vs-phase-2)
3. [Kiến trúc tổng thể](#3-kiến-trúc-tổng-thể)
4. [Thiết kế Database PostgreSQL](#4-thiết-kế-database-postgresql)
5. [Audit Log – Thiết kế & AOP](#5-audit-log)
6. [Backend Spring Boot – Các quyết định thiết kế](#6-backend-spring-boot)
7. [RabbitMQ – Thiết kế tối giản](#7-rabbitmq)
8. [Frontend Next.js – Cấu trúc](#8-frontend-nextjs)
9. [Triển khai – Docker Compose đơn giản](#9-triển-khai)
10. [Lộ trình 5 ngày chi tiết](#10-lộ-trình-5-ngày)

---

## 1. Triết lý MVP

Mục tiêu không phải là kiến trúc đẹp, mà là **chạy được trong 5 ngày với 1 người**.

**Nguyên tắc:**
- Chỉ làm những gì user/admin thực sự cần để dùng được hệ thống
- Defer mọi thứ có thể defer: search, AI, monitoring, CI/CD, replica
- Không có "có thể cần sau" trong 5 ngày đầu

**Những thứ bị cắt khỏi MVP (lý do cụ thể):**

| Bỏ | Lý do |
|---|---|
| Elasticsearch | Dùng PostgreSQL ILIKE đủ cho vài nghìn sản phẩm |
| MongoDB | PostgreSQL JSONB + bảng `audit_logs` đủ dùng |
| Refresh token | JWT 7 ngày access token đơn giản hơn, đủ an toàn cho MVP |
| Multiple instances | 1 VPS, 1 instance, không cần load balancer phức tạp |
| Blue-green deploy | Shell script `docker compose up -d` đủ rồi |
| CI/CD pipeline | Script bash thủ công, không cần GitHub Actions |
| Rate limiting phức tạp | Nginx basic rate limit hoặc bỏ luôn cho MVP |
| AI recommendation | Không có data, không có thời gian |
| Distributed tracing | Logs đơn giản đủ debug |
| E2E & Integration test | Chỉ unit test service layer, test thủ công trên browser |
| WebSocket notification | Admin reload trang để xem đơn mới |
| PDF invoice | Trả về thông báo text là đủ |

---

## 2. Bảng so sánh MVP vs Phase 2

| Tính năng | MVP (5 ngày) | Phase 2 (sau) |
|---|---|---|
| **Search sản phẩm** | PostgreSQL `ILIKE` + index | Elasticsearch full-text |
| **Audit log** | Bảng `audit_logs` trong PostgreSQL | Tách MongoDB hoặc giữ nguyên |
| **Notification** | RabbitMQ → email xác nhận đơn hàng | WebSocket push, SMS, app notification |
| **Auth** | JWT access token 7 ngày | Access + Refresh token, blacklist trên Redis |
| **Rate limiting** | Không hoặc Nginx basic | Redis sliding window |
| **Scale** | 1 instance, 1 VPS | Multi-instance, Nginx load balancer |
| **Deploy** | Script bash + docker compose | GitHub Actions CI/CD, staging env |
| **Test** | Unit test service layer | Integration test, E2E Cypress |
| **PDF invoice** | Không | iText/PDFBox, lưu S3 |
| **AI** | Không | Recommendation, demand forecast |
| **Monitoring** | Logs cơ bản | Prometheus + Grafana |
| **DB** | PostgreSQL master only | Master + Read replica, pgBouncer |
| **Cache** | Redis chỉ cho giỏ hàng | Cache layer đầy đủ cho product list |
| **Payment** | COD only | VNPay, MoMo integration |
| **File upload** | Lưu local `/uploads` | S3/MinIO |

---

## 3. Kiến trúc tổng thể

```
┌─────────────────────────────────────────────────────────────┐
│                        VPS (1 máy)                          │
│                                                             │
│   ┌──────────────┐        ┌─────────────────────────────┐  │
│   │  Next.js     │        │   Spring Boot (port 8080)   │  │
│   │  (port 3000) │◄──────►│                             │  │
│   │  Admin UI    │  HTTP  │  Controllers                │  │
│   │  User UI     │        │  Services                   │  │
│   └──────────────┘        │  Repositories               │  │
│                           │  RabbitMQ Producer          │  │
│                           │  RabbitMQ Consumer          │  │
│                           │  AOP (Audit)                │  │
│                           └──────────┬──────────────────┘  │
│                                      │                      │
│        ┌─────────────────────────────┼──────────────────┐  │
│        │                             │                  │  │
│   ┌────▼────┐              ┌─────────▼──────┐   ┌──────▼┐ │
│   │  Redis  │              │  PostgreSQL     │   │Rabbit │ │
│   │ (cart)  │              │  (main DB +     │   │  MQ   │ │
│   └─────────┘              │   audit_logs)   │   └───────┘ │
│                            └─────────────────┘             │
└─────────────────────────────────────────────────────────────┘
```

**Lý do chọn cấu trúc này:**
- Một process duy nhất → không có network latency giữa module
- PostgreSQL xử lý cả data chính lẫn audit → 1 connection pool, 1 backup
- Redis chỉ làm 1 việc: lưu giỏ hàng (key `cart:{userId}`, TTL 7 ngày)
- RabbitMQ chỉ làm 2 việc: gửi email xác nhận đơn + thông báo admin qua email

**Nginx (optional):** Nếu cần HTTPS, đặt Nginx phía trước làm reverse proxy và SSL termination.

---

## 4. Thiết kế Database PostgreSQL

### 4.1 Sơ đồ quan hệ (ERD rút gọn)

```
users ─────────────────── orders ─────── order_items ─── products
  │                          │                                │
  └── addresses           audit_logs                     categories
                                                          product_images
```

### 4.2 Các bảng chính

**`users`**
- `id`, `full_name`, `email` (unique), `password_hash`, `phone`, `role` (ADMIN/USER), `is_active`, `created_at`, `deleted_at`

**`categories`**
- `id`, `name`, `slug` (unique), `parent_id` (self-ref, nullable), `is_active`, `sort_order`

**`products`**
- `id`, `name`, `slug` (unique), `description`, `price`, `original_price`, `stock_quantity`, `version` (optimistic lock), `category_id` (FK), `sku` (unique), `status` (ACTIVE/INACTIVE/OUT_OF_STOCK), `thumbnail_url`, `is_featured`, `created_at`, `updated_at`, `deleted_at`

**`product_images`**
- `id`, `product_id` (FK), `url`, `sort_order`, `is_primary`

**`addresses`**
- `id`, `user_id` (FK), `recipient_name`, `recipient_phone`, `address_line1`, `ward`, `district`, `province`, `is_default`

**`orders`**
- `id`, `order_code` (unique, format `ORD-YYYYMMDD-NNNN`), `user_id` (FK), `status` (PENDING/CONFIRMED/SHIPPING/DELIVERED/CANCELLED), `subtotal`, `shipping_fee`, `total_amount`, `payment_method` (COD – MVP only), `payment_status`, `note`, `shipping_*` (snapshot địa chỉ), `created_at`, `updated_at`

**`order_items`**
- `id`, `order_id` (FK), `product_id` (FK), `product_name_snapshot`, `unit_price_snapshot`, `quantity`, `subtotal`

**`inventory_transactions`**
- `id`, `product_id`, `order_id` (nullable), `type` (ORDER_PLACED/ORDER_CANCELLED/RESTOCK), `quantity_delta`, `quantity_after`, `created_by`, `created_at`

### 4.3 Bảng `audit_logs`

Đây là bảng trung tâm cho toàn bộ audit trail, lưu trong cùng PostgreSQL.

| Cột | Kiểu | Mô tả |
|---|---|---|
| `id` | `bigserial` PRIMARY KEY | Auto-increment |
| `actor_id` | `bigint` nullable | userId của người thực hiện (null = anonymous) |
| `actor_email` | `varchar(255)` | Snapshot email tại thời điểm (tránh JOIN) |
| `actor_role` | `varchar(20)` | ADMIN / USER / SYSTEM |
| `action` | `varchar(100)` NOT NULL | Tên hành động, VD: `PRODUCT_CREATED`, `ORDER_STATUS_CHANGED` |
| `entity_type` | `varchar(50)` | Loại đối tượng: `PRODUCT`, `ORDER`, `USER` |
| `entity_id` | `bigint` nullable | ID của đối tượng bị tác động |
| `details` | `jsonb` | Dữ liệu bổ sung (before/after values, payload tóm tắt) |
| `ip_address` | `varchar(45)` | IPv4 hoặc IPv6 |
| `user_agent` | `text` | Browser/client string |
| `result` | `varchar(10)` NOT NULL | `SUCCESS` hoặc `FAIL` |
| `error_message` | `text` nullable | Lý do thất bại nếu result = FAIL |
| `created_at` | `timestamptz` NOT NULL | Thời điểm xảy ra |

**Indexes:**
```sql
CREATE INDEX idx_audit_actor_id    ON audit_logs(actor_id);
CREATE INDEX idx_audit_action      ON audit_logs(action);
CREATE INDEX idx_audit_entity      ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_created_at  ON audit_logs(created_at DESC);
-- Index trên JSONB cho query nâng cao sau này (Phase 2)
-- CREATE INDEX idx_audit_details_gin ON audit_logs USING gin(details);
```

**Quyết định thiết kế:** Dùng `jsonb` cho `details` thay vì tách cột riêng vì mỗi action có payload khác nhau. Snapshot `actor_email` tránh mất thông tin khi user bị xóa.

**Ví dụ dữ liệu trong `details`:**
```json
// PRODUCT_UPDATED
{ "before": { "price": 100000, "stock": 50 }, "after": { "price": 90000, "stock": 50 } }

// ORDER_STATUS_CHANGED
{ "from": "PENDING", "to": "CONFIRMED", "note": "Đã xác nhận" }

// LOGIN_FAILED
{ "email": "user@example.com", "reason": "wrong_password" }
```

### 4.4 Indexes quan trọng

```sql
-- Product search + filter (thay Elasticsearch)
CREATE INDEX idx_products_category_status ON products(category_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_name_trgm ON products USING gin(name gin_trgm_ops); -- cần pg_trgm extension
CREATE INDEX idx_products_price ON products(price) WHERE deleted_at IS NULL;

-- Order queries
CREATE INDEX idx_orders_user_id    ON orders(user_id);
CREATE INDEX idx_orders_status     ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
```

---

## 5. Audit Log

### 5.1 Thiết kế AOP

Thay vì gọi `auditService.log(...)` rải khắp code, dùng **Spring AOP** để tự động ghi log.

**Cơ chế hoạt động:**

1. Tạo annotation `@Auditable` với thuộc tính `action` (VD: `PRODUCT_CREATED`)
2. Đánh dấu các method ở Service layer cần audit
3. `AuditAspect` (dạng `@Around` advice) bắt trước/sau method:
   - Trước: lấy thông tin actor từ `SecurityContextHolder`, lấy IP/UA từ `HttpServletRequest` (inject qua `RequestContextHolder`)
   - Sau (success): gọi `auditLogRepository.save(...)` với result = SUCCESS
   - Sau (exception): gọi `auditLogRepository.save(...)` với result = FAIL, lưu error message

**Pseudo-code AuditAspect:**
```
@Around các method có @Auditable:
  1. Lấy actor từ SecurityContext
  2. Gọi method gốc (joinPoint.proceed())
  3. Nếu thành công → lưu audit log (result=SUCCESS)
  4. Nếu exception → lưu audit log (result=FAIL), rethrow
```

**Các action cần đánh dấu @Auditable:**

| Action | Method |
|---|---|
| `LOGIN_SUCCESS` / `LOGIN_FAILED` | `AuthService.login()` |
| `LOGOUT` | `AuthService.logout()` |
| `PRODUCT_CREATED` | `ProductService.createProduct()` |
| `PRODUCT_UPDATED` | `ProductService.updateProduct()` |
| `PRODUCT_DELETED` | `ProductService.deleteProduct()` |
| `ORDER_CREATED` | `OrderService.createOrder()` |
| `ORDER_STATUS_CHANGED` | `OrderStatusService.updateStatus()` |
| `ORDER_CANCELLED` | `OrderService.cancelOrder()` |

### 5.2 Lưu ý về performance

Ghi audit log là **synchronous** trong MVP (đơn giản hơn). Nếu sau này cần tách ra async, chuyển sang publish RabbitMQ event rồi consumer mới ghi vào DB.

---

## 6. Backend Spring Boot

### 6.1 Cấu trúc package (rút gọn cho 1 người)

```
com.company.shopapp/
├── config/           # SecurityConfig, RabbitMQConfig, RedisConfig
├── security/         # JWT provider, filter, UserDetailsService
├── domain/
│   ├── user/         # controller, service, repo, entity, dto
│   ├── product/      # controller (admin + public), service, repo, entity, dto
│   ├── order/        # controller (admin + user), service, repo, entity, dto
│   └── notification/ # RabbitMQ consumers, EmailService
├── audit/            # @Auditable annotation, AuditAspect, AuditLogRepository
├── common/           # GlobalExceptionHandler, PageResponse, validators
└── infrastructure/
    └── cache/        # CartService (Redis wrapper)
```

### 6.2 REST API Endpoints (MVP only)

**Auth**

| Method | Path | Role | Mô tả |
|---|---|---|---|
| POST | `/api/v1/auth/login` | Public | Trả về JWT |
| POST | `/api/v1/auth/register` | Public | Đăng ký user |
| POST | `/api/v1/auth/logout` | Auth | Ghi audit, client bỏ token |

**Admin – Products**

| Method | Path | Mô tả |
|---|---|---|
| GET | `/api/v1/admin/products` | Danh sách, page + filter + search (ILIKE) |
| GET | `/api/v1/admin/products/{id}` | Chi tiết |
| POST | `/api/v1/admin/products` | Tạo mới |
| PUT | `/api/v1/admin/products/{id}` | Cập nhật |
| DELETE | `/api/v1/admin/products/{id}` | Soft delete |

**Public – Products**

| Method | Path | Mô tả |
|---|---|---|
| GET | `/api/v1/products` | Danh sách (phân trang, lọc) |
| GET | `/api/v1/products/{id}` | Chi tiết |

**User – Cart & Orders**

| Method | Path | Mô tả |
|---|---|---|
| GET/POST/PUT/DELETE | `/api/v1/cart/**` | Quản lý giỏ hàng (Redis) |
| POST | `/api/v1/orders` | Tạo đơn hàng |
| GET | `/api/v1/orders` | Lịch sử của user |
| GET | `/api/v1/orders/{id}` | Chi tiết |
| PATCH | `/api/v1/orders/{id}/cancel` | Hủy (chỉ khi PENDING) |

**Admin – Orders**

| Method | Path | Mô tả |
|---|---|---|
| GET | `/api/v1/admin/orders` | Danh sách + filter |
| GET | `/api/v1/admin/orders/{id}` | Chi tiết đầy đủ |
| PATCH | `/api/v1/admin/orders/{id}/status` | Cập nhật trạng thái |

### 6.3 Các quyết định thiết kế quan trọng

**JWT Access Token 7 ngày – không có refresh token:**
- Lý do: Giảm độ phức tạp (không cần blacklist, không cần refresh endpoint)
- Trade-off: Không thể thu hồi token trước hạn (chấp nhận được cho MVP)
- Logout chỉ ghi audit log và xóa token ở client-side

**Optimistic Locking cho Product stock:**
- Dùng `@Version` trên `Product.stockQuantity`
- Khi 2 request cùng đặt hàng, 1 trong 2 sẽ bị `ObjectOptimisticLockingFailureException` → trả 409 cho client
- Phù hợp với load thấp của MVP

**Order Status State Machine:**
- Logic transition hợp lệ: PENDING→CONFIRMED, CONFIRMED→SHIPPING, SHIPPING→DELIVERED, PENDING/CONFIRMED→CANCELLED
- Kiểm tra bằng enum method `canTransitionTo()`, ném exception nếu invalid

**Soft Delete:**
- Product: thêm cột `deleted_at`, mọi query đều `WHERE deleted_at IS NULL`
- User: thêm `is_active = false` thay vì xóa thật

**PostgreSQL thay MongoDB cho lịch sử đơn hàng:**
- Order history lưu trong `audit_logs` (filter theo `entity_type='ORDER'`, `entity_id=orderId`)
- Không cần schema riêng, JSONB đủ linh hoạt

### 6.4 Xử lý lỗi

`GlobalExceptionHandler` (@RestControllerAdvice) xử lý tập trung:
- `ResourceNotFoundException` → 404
- `InsufficientStockException` → 422
- `InvalidOrderStatusTransitionException` → 400
- `ObjectOptimisticLockingFailureException` → 409
- `MethodArgumentNotValidException` (JSR-380) → 400 với danh sách lỗi validation
- Mọi exception khác → 500

---

## 7. RabbitMQ

### 7.1 Thiết kế tối giản cho MVP

MVP chỉ cần **2 queue** phục vụ 2 mục đích:

| Queue | Trigger | Consumer làm gì |
|---|---|---|
| `order.confirmation` | Khi user tạo đơn hàng thành công | Gửi email xác nhận đơn cho user |
| `order.admin.notify` | Khi user tạo đơn hàng thành công | Gửi email thông báo đơn mới cho admin |

**Exchange:** 1 topic exchange `order.exchange`

**Routing keys:**
- `order.created` → bind cả 2 queue trên (fan-out behavior)

**Dead Letter Queue:**
- `dlq.order` – các message bị reject sau 3 retry sẽ vào đây để debug

**Lý do không cần thêm queue:**
- Queue inventory transaction: ghi thẳng vào DB trong cùng transaction với tạo đơn hàng (đơn giản và đảm bảo consistency hơn)
- Queue PDF: không làm PDF trong MVP
- Queue status email: Phase 2, khi admin update status thì hiện tại chỉ cần lưu DB

### 7.2 Retry strategy

Dùng `Spring Retry` với 3 lần thử, backoff 2s → 4s → 8s. Nếu vẫn fail → NACK → vào DLQ. Consumer đọc DLQ thủ công hoặc alert qua log.

### 7.3 Email service

Dùng **JavaMailSender** với SMTP (Gmail SMTP hoặc Mailgun free tier). Không dùng SendGrid (cần đăng ký phức tạp cho MVP).

Template email đơn giản: plain HTML template với Thymeleaf, nhúng thông tin đơn hàng.

---

## 8. Frontend Next.js

### 8.1 Cấu trúc App Router

```
app/
├── (auth)/login/page.tsx
├── (admin)/
│   ├── layout.tsx           # Sidebar + auth guard
│   ├── dashboard/page.tsx   # Thống kê đơn giản
│   ├── products/
│   │   ├── page.tsx         # Danh sách + search + phân trang
│   │   ├── new/page.tsx
│   │   └── [id]/edit/page.tsx
│   └── orders/
│       ├── page.tsx         # Danh sách + filter theo status
│       └── [id]/page.tsx    # Chi tiết + cập nhật status
└── (user)/
    ├── layout.tsx           # Header + footer
    ├── page.tsx             # Trang chủ / danh sách SP
    ├── products/[slug]/page.tsx
    ├── cart/page.tsx
    ├── checkout/page.tsx
    └── orders/
        ├── page.tsx
        └── [id]/page.tsx
```

### 8.2 State Management

**Zustand:** Lưu auth state (user, token) và cart state
- `authStore`: user info, accessToken, isAuthenticated
- `cartStore`: items, total (synced với Redis qua API)

**React Query (TanStack Query):** Mọi API call
- Cache tự động, invalidate khi mutation
- Loading/error state tích hợp sẵn

**Lý do không dùng Redux:** Quá phức tạp cho 1 người trong 5 ngày.

### 8.3 API Client

Axios instance với interceptor:
- Request interceptor: đính token vào header `Authorization: Bearer ...`
- Response interceptor: nếu 401 → redirect về trang login

### 8.4 Search sản phẩm

Debounce 300ms khi user gõ vào search box → gọi API với query param `?search=`. Server dùng PostgreSQL ILIKE với `pg_trgm` index. Đủ nhanh cho vài nghìn sản phẩm.

---

## 9. Triển khai

### 9.1 Docker Compose (Production – 1 VPS)

```yaml
# docker-compose.yml
services:
  backend:   # Spring Boot :8080
  frontend:  # Next.js :3000
  postgres:  # PostgreSQL :5432
  redis:     # Redis :6379
  rabbitmq:  # RabbitMQ :5672, management :15672
  nginx:     # Reverse proxy :80/:443 (optional)
```

**Lý do không có nhiều hơn:** 1 VPS, 1 người maintain. Scale sau khi có user thật.

### 9.2 Deploy script

Không CI/CD pipeline. Chỉ cần:
```
# deploy.sh
git pull origin main
docker compose build backend frontend
docker compose up -d
docker compose logs -f backend
```

Chạy tay khi cần deploy. Downtime < 30s là chấp nhận được ở giai đoạn MVP.

### 9.3 Secrets management

Dùng file `.env` trên VPS (không commit vào git). Biến môi trường cần thiết: DB password, Redis password, JWT secret, SMTP credentials, RabbitMQ credentials.

### 9.4 Backup

Cron job đơn giản: `pg_dump` mỗi ngày → upload lên cloud storage (hoặc Google Drive). Không cần tool phức tạp.

---

## 10. Lộ trình 5 ngày

### Ngày 1 – Nền tảng Backend

**Sáng: Project setup (3h)**
- [ ] Tạo Spring Boot project (Spring Initializr): Web, JPA, Security, RabbitMQ, Redis, Validation, Actuator
- [ ] Cấu hình `application.yml` cho local (PostgreSQL, Redis, RabbitMQ)
- [ ] Tạo `docker-compose.dev.yml` chỉ có PostgreSQL + Redis + RabbitMQ (không build app)
- [ ] Cấu hình `SecurityConfig` (permit `/api/v1/auth/**`, require auth còn lại)
- [ ] Implement JWT: `JwtTokenProvider`, `JwtAuthenticationFilter`

**Chiều: Database & Auth (4h)**
- [ ] Tạo toàn bộ Liquibase/Flyway migration: tất cả bảng (users, categories, products, product_images, addresses, orders, order_items, inventory_transactions, audit_logs)
- [ ] Implement `AuthController` + `AuthService`: login, register, logout
- [ ] Implement `AuditAspect` + `@Auditable` annotation + `AuditLogRepository`
- [ ] Unit test `AuthService`

---

### Ngày 2 – Product Module

**Sáng: Admin Product API (4h)**
- [ ] `Product` entity + `ProductRepository` (với query filter ILIKE + phân trang)
- [ ] `ProductService`: createProduct, updateProduct, deleteProduct (soft), getAll (filter), getById
- [ ] `AdminProductController`: 5 endpoints CRUD
- [ ] Đánh dấu `@Auditable` trên các method service
- [ ] Unit test `ProductService`

**Chiều: Public Product API + File upload (3h)**
- [ ] `ProductController`: GET list (public), GET detail (public)
- [ ] File upload endpoint: nhận ảnh, lưu vào `/uploads` directory (local filesystem, không S3)
- [ ] Serve static files từ `/uploads` qua Spring MVC
- [ ] `CategoryController`: CRUD danh mục (đơn giản)

---

### Ngày 3 – Order Module + RabbitMQ

**Sáng: Cart & Order API (4h)**
- [ ] `CartService`: lưu giỏ hàng vào Redis (`HSET cart:{userId}`), add/update/remove/clear
- [ ] `CartController`: 5 endpoints
- [ ] `OrderService`: createOrder (validate stock, lock rows, update stock, insert order, publish event)
- [ ] `OrderController` (user): tạo đơn, xem lịch sử, hủy đơn
- [ ] Unit test `OrderService` (mock repo + publisher)

**Chiều: Admin Order + RabbitMQ (3h)**
- [ ] `AdminOrderController`: list (filter), detail, update status
- [ ] `OrderStatusService`: state machine, validate transition
- [ ] `RabbitMQConfig`: exchange, 2 queues, DLQ, bindings
- [ ] `OrderEventPublisher`: publish khi tạo đơn
- [ ] `OrderConfirmationConsumer` + `AdminNotifyConsumer`: consume và gọi EmailService
- [ ] `EmailService`: gửi email HTML đơn giản qua JavaMailSender

---

### Ngày 4 – Frontend

**Sáng: Setup + Admin UI (4h)**
- [ ] Tạo Next.js project (App Router, TypeScript, Tailwind CSS, shadcn/ui)
- [ ] Axios instance + interceptors, React Query setup, Zustand authStore
- [ ] Trang Login (form → gọi API → lưu token)
- [ ] Admin layout (sidebar navigation)
- [ ] Trang Admin Products: bảng phân trang, search, filter
- [ ] Form tạo/sửa sản phẩm (upload ảnh, validation)

**Chiều: Admin Orders + User UI (3h)**
- [ ] Trang Admin Orders: bảng filter theo status, cập nhật status (dropdown + confirm)
- [ ] Trang chi tiết đơn hàng (admin): thông tin đầy đủ + lịch sử audit
- [ ] User layout (header + footer)
- [ ] Trang danh sách sản phẩm (search, filter giá, phân trang)
- [ ] Trang chi tiết sản phẩm + nút thêm vào giỏ

---

### Ngày 5 – Hoàn thiện + Deploy

**Sáng: User flows + Bug fixes (4h)**
- [ ] Trang giỏ hàng (CartStore, gọi API)
- [ ] Trang Checkout (form địa chỉ, chọn COD, tạo đơn)
- [ ] Trang lịch sử đơn hàng user + chi tiết
- [ ] Test thủ công toàn bộ flow: register → browse → add to cart → checkout → admin confirm
- [ ] Fix bug phát sinh

**Chiều: Deploy (3h)**
- [ ] Tạo `docker-compose.yml` production (tất cả services)
- [ ] Build Docker image backend (`Dockerfile` multi-stage)
- [ ] Build Docker image frontend (`Dockerfile`)
- [ ] Cấu hình Nginx (nếu cần HTTPS)
- [ ] Upload lên VPS, chạy `docker compose up -d`
- [ ] Smoke test trên production URL
- [ ] Viết `deploy.sh` đơn giản cho lần sau

---

## Ghi chú cuối

Tài liệu này là **chỉ thiết kế** – không chứa code đầy đủ. Mọi quyết định thiết kế đều hướng đến mục tiêu: **chạy được trong 5 ngày với 1 người, đủ tính năng cho MVP, dễ mở rộng sau này**.

Khi đội lên 2-3 người hoặc có user thật, ưu tiên Phase 2 theo thứ tự: refresh token → CI/CD → read replica → Elasticsearch → multi-instance.