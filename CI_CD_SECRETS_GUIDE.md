# Hướng Dẫn Cấu Hình GitHub Secrets & Deploy Lần Đầu

Tài liệu này hướng dẫn cách cấu hình các biến bảo mật (Secrets) trên GitHub và các bước thiết lập thủ công trên server (VPS) trước khi chạy CI/CD Pipeline.

---

## Bước 1: Cấu hình GitHub Actions Secrets
Truy cập vào Repository của bạn trên GitHub, chọn **Settings > Secrets and variables > Actions > New repository secret** và thêm các biến sau:

| Tên Secret | Mô tả | Ví dụ |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Địa chỉ URL API của Backend ở môi trường Production | `https://api.yourdomain.com/api/v1` |
| `SSH_HOST` | Địa chỉ IP của máy chủ VPS Production | `123.45.67.89` |
| `SSH_USERNAME` | Tên người dùng dùng để đăng nhập SSH vào VPS | `ubuntu` hoặc `root` |
| `SSH_KEY` | Nội dung của Private SSH Key tương ứng (dùng đăng nhập không cần mật khẩu) | `-----BEGIN OPENSSH PRIVATE KEY-----\n...` |
| `SSH_PORT` | Cổng kết nối SSH (mặc định là `22` nếu bỏ trống) | `22` |
| `DEPLOY_PATH` | Đường dẫn thư mục chứa dự án trên VPS | `/home/ubuntu/7eleven` |

---

## Bước 2: Thiết lập thủ công trên VPS trước lần deploy đầu tiên
Hệ thống CI/CD cần các file cấu hình và môi trường có sẵn trên server trước khi thực hiện pull và chạy ứng dụng. Vui lòng thực hiện các bước sau trên VPS:

1. **Cài đặt Docker và Docker Compose:**
   Đảm bảo máy chủ VPS đã được cài đặt và kích hoạt sẵn dịch vụ Docker.
   ```bash
   # Kiểm tra docker
   docker --version
   # Kiểm tra docker compose
   docker compose version
   ```

2. **Tạo thư mục dự án:**
   Tạo thư mục khớp với giá trị `DEPLOY_PATH` đã cấu hình ở bước 1.
   ```bash
   mkdir -p /home/ubuntu/7eleven
   cd /home/ubuntu/7eleven
   ```

3. **Copy file `docker-compose.yml` lên VPS:**
   Sao chép nội dung file `docker-compose.yml` của dự án từ local lên thư mục `/home/ubuntu/7eleven/docker-compose.yml` trên VPS.

4. **Tạo file cấu hình `.env.prod` trên VPS:**
   Tạo file `.env.prod` tại thư mục dự án và thiết lập các biến môi trường Production thực tế:
   ```bash
   nano .env.prod
   ```
   *Nội dung mẫu tham khảo:*
   ```ini
   # Database Config
   DB_PORT=5432
   DB_NAME=shopdb_prod
   DB_USER=postgres_prod
   DB_PASSWORD=prod_highly_secure_db_password

   # Redis Config
   REDIS_PORT=6379
   REDIS_PASSWORD=prod_highly_secure_redis_password

   # Spring Boot Environment
   SPRING_PROFILE=prod
   JWT_SECRET=prod_very_secure_and_very_long_jwt_secret_signing_key_32_bytes_long

   # Cloudinary Storage
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret

   # Frontend URLs
   NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   ```

---

## Bước 3: Đẩy code và chạy tự động
* Khi bạn tạo Pull Request hoặc Push code lên nhánh `develop` hoặc `main`, hệ thống sẽ tự động chạy các job kiểm thử unit test.
* Khi thay đổi được đẩy (hoặc merge) trực tiếp lên nhánh `main`, hệ thống CI/CD sẽ tự động:
  1. Chạy test cho cả Frontend và Backend.
  2. Build và push Docker Image mới lên GitHub Container Registry (GHCR).
  3. SSH vào VPS để đăng nhập GHCR, thực hiện pull image mới và khởi chạy lại các container qua Docker Compose.
