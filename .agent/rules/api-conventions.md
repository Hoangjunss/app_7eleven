---
trigger: always_on
---

# API Conventions

- Base path: `/api/v1/`
- RESTful: resource names dạng số nhiều (`/products`, `/orders`)
- Admin endpoints: tiền tố `/admin`, ví dụ `/api/v1/admin/products`
- Response wrapper: `{ "data": ..., "message": "...", "status": 200 }`
- Lỗi: trả về `ProblemDetail` (RFC 7807) hoặc custom `ErrorResponse`.
- Phân trang: dùng `?page=0&size=20`, response chứa `content`, `totalElements`, `totalPages`.
- HTTP methods: GET, POST, PUT, DELETE, PATCH (cho update status).