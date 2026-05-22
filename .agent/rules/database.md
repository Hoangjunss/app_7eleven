---
trigger: always_on
---

# Database Rules

- Chỉ PostgreSQL, không MongoDB.
- Tất cả bảng đều có `created_at`, `updated_at`, `deleted_at` (soft delete) nếu cần.
- Sử dụng `@Version` cho optimistic lock trên bảng `products` (cột stock_quantity).
- Bảng `audit_logs` bắt buộc với các cột: actor_id, actor_email, actor_role, action, entity_type, entity_id, details (jsonb), ip_address, user_agent, result, error_message, created_at.
- Indexes: nên có trên các cột foreign key, status, created_at, và gin_trgm_ops cho tìm kiếm sản phẩm.
- Tìm kiếm sản phẩm dùng `ILIKE` hoặc `pg_trgm` (không Elasticsearch).