# Kế Hoạch CI/CD Production - 7Eleven Shop

Tài liệu này chi tiết cấu hình luồng tích hợp và triển khai liên tục (CI/CD) cho nhánh `main` lên máy chủ vận hành (Production VPS) sử dụng **GitHub Actions** và **Docker Compose**.

---

## 1. Danh Sách Secrets Cần Thiết Trên GitHub
Để chạy được workflow triển khai, bạn cần truy cập vào **GitHub Repository Settings -> Secrets and Variables -> Actions** và thêm các secrets sau:

| Tên Secret | Ý Nghĩa / Giá Trị | Ví Dụ |
| :--- | :--- | :--- |
| `SSH_HOST` | Địa chỉ IP Public của VPS | `103.72.99.211` |
| `SSH_USERNAME` | Tên đăng nhập SSH của VPS | `root` |
| `SSH_KEY` | Nội dung của File Private Key (`id_rsa` / `id_ed25519`) dùng để SSH | `-----BEGIN OPENSSH PRIVATE KEY----- ...` |
| `SSH_PORT` | Cổng kết nối SSH của VPS | `24700` |
| `DEPLOY_PATH` | Đường dẫn tuyệt đối đến thư mục chứa dự án trên VPS | `/root/7eleven` |
| `ENV_PROD_CONTENT` | Nội dung đầy đủ của file cấu hình môi trường `.env.prod` để tạo trên server | *(Xem chi tiết nội dung file dưới đây)* |

### Mẫu nội dung cho `ENV_PROD_CONTENT`:
```ini
SPRING_PROFILE=prod
DB_NAME=seven_eleven_prod
DB_USER=postgres_prod
DB_PASSWORD=seven_eleven_prod_password
DB_PORT=5432
REDIS_PORT=6379
REDIS_PASSWORD=seven_eleven_redis_pass_prod
JWT_SECRET=prodsecretkeyprodsecretkeyprodsecretkeyprodsecretkeyprodsecretkeyprodsecretkey
CLOUDINARY_CLOUD_NAME=dgts7tmnb
CLOUDINARY_API_KEY=572933874577745
CLOUDINARY_API_SECRET=CgRjc0dmftxHE6F8m1k-SRwXEVo
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
```

---

## 2. Kịch Bản Workflow Hoàn Chỉnh (`.github/workflows/cd-deploy.yml`)
Dưới đây là nội dung chi tiết của file cấu hình GitHub Actions. File này đã được thiết kế sẵn sàng cho việc copy-paste và chạy ngay lập tức.

```yaml
name: Production CI/CD Pipeline

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

jobs:
  build-and-test:
    name: Build and Verification
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Set up JDK 21
        uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
          cache: 'maven'

      - name: Build and Test Backend (Maven)
        run: |
          cd backend
          mvn clean test -DskipTests=false

      - name: Set up Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install Frontend Dependencies
        run: |
          cd frontend
          npm ci --legacy-peer-deps

      - name: Build Frontend (Next.js)
        env:
          NEXT_PUBLIC_API_URL: http://localhost:8080/api/v1
        run: |
          cd frontend
          npm run build

  deploy:
    name: Deploy to Production VPS
    needs: build-and-test
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: SSH and Deploy via Docker Compose
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          port: ${{ secrets.SSH_PORT }}
          script: |
            echo "========================================="
            echo "   BẮT ĐẦU QUY TRÌNH TRIỂN KHAI TRÊN VPS "
            echo "========================================="

            # 1. Kiểm tra & cài đặt Docker + Docker Compose nếu chưa có
            if ! command -v docker &> /dev/null; then
              echo "[SYSTEM] Docker chưa được cài đặt. Tiến hành cài đặt..."
              curl -fsSL https://get.docker.com -o get-docker.sh
              sh get-docker.sh
              rm get-docker.sh
            fi

            if ! docker compose version &> /dev/null; then
              echo "[SYSTEM] Docker Compose v2 chưa được cài đặt. Tiến hành cài đặt..."
              mkdir -p /usr/local/lib/docker/cli-plugins
              curl -SL https://github.com/docker/compose/releases/download/v2.24.5/docker-compose-linux-x86_64 -o /usr/local/lib/docker/cli-plugins/docker-compose
              chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
            fi

            # 2. Kiểm tra & cài đặt Git nếu chưa có
            if ! command -v git &> /dev/null; then
              echo "[SYSTEM] Git chưa cài đặt. Tiến hành cài đặt..."
              apt-get update && apt-get install -y git
            fi

            # 3. Quản lý thư mục Deploy và Repo Clone/Pull
            DEPLOY_PATH="${{ secrets.DEPLOY_PATH }}"
            mkdir -p $(dirname "$DEPLOY_PATH")

            if [ ! -d "$DEPLOY_PATH/.git" ]; then
              echo "[REPO] Chưa có repo. Tiến hành clone repository lần đầu..."
              git clone https://github.com/Hoangjunss/app_7eleven.git "$DEPLOY_PATH"
              cd "$DEPLOY_PATH"
            else
              echo "[REPO] Repo đã tồn tại. Di chuyển vào thư mục dự án..."
              cd "$DEPLOY_PATH"
              
              # Dọn dẹp các chỉnh sửa local trên VPS nếu có để tránh xung đột git pull
              echo "[REPO] Dọn dẹp/Stash các thay đổi cục bộ..."
              git stash
              git fetch --all
              git reset --hard origin/main
            fi

            # 4. Tạo lại file biến môi trường .env.prod bảo mật
            echo "[ENV] Ghi cấu hình file .env.prod..."
            echo "${{ secrets.ENV_PROD_CONTENT }}" > .env.prod

            # 5. Build và khởi chạy container
            echo "[DOCKER] Tiến hành hạ các container cũ và build container mới..."
            docker compose -f docker-compose.yml --env-file .env.prod down --remove-orphans
            
            # Khởi chạy Docker Compose build (Build trực tiếp trên máy hoặc có thể tích hợp registry)
            docker compose -f docker-compose.yml --env-file .env.prod up --build -d

            # 6. Kiểm tra trạng thái sức khỏe (Healthcheck) sau khi deploy
            echo "[HEALTHCHECK] Chờ các service khởi động trong 15 giây..."
            sleep 15

            echo "========================================="
            echo "         DANH SÁCH CÁC CONTAINER         "
            echo "========================================="
            docker ps --format "table {{.Names}}\t{{.Status}}"

            # Đếm số lượng container đang hoạt động ở trạng thái healthy
            HEALTHY_COUNT=$(docker ps --filter "health=healthy" | wc -l)
            HEALTHY_COUNT=$((HEALTHY_COUNT - 1)) # Trừ đi dòng header

            echo "[HEALTHCHECK] Số container chạy Healthy: $HEALTHY_COUNT / 4"
            if [ "$HEALTHY_COUNT" -lt 4 ]; then
              echo "[WARNING] Phát hiện dịch vụ hoạt động không ổn định hoặc chưa sẵn sàng!"
              docker ps
              exit 1
            else
              echo "[SUCCESS] Toàn bộ 4 dịch vụ (Postgres, Redis, Backend, Frontend) hoạt động rất tốt!"
            fi

            # 7. Giải phóng dung lượng ổ đĩa (Dọn dẹp cache Docker build thừa)
            echo "[CLEANUP] Giải phóng dung lượng ổ đĩa VPS..."
            docker builder prune -f --filter "until=24h"
            docker image prune -f

            echo "========================================="
            echo "    TIẾN TRÌNH DEPLOY HOÀN THÀNH TỐT ĐẸP  "
            echo "========================================="
```

---

## 3. Hướng Dẫn Cấu Hình VPS Lần Đầu (Initial VPS Setup)
Trước khi kích hoạt pipeline tự động, bạn cần thực hiện chuẩn bị môi trường trên máy chủ VPS:

1. **Truy cập SSH vào VPS bằng cổng 24700:**
   ```bash
   ssh root@103.72.99.211 -p 24700
   ```

2. **Cài đặt các gói phần mềm cơ bản (Docker, Git) thủ công (Hoặc để script CI/CD tự cài đặt ở bước 1):**
   ```bash
   apt update && apt install -y git curl
   ```

3. **Cấu hình SSH Key trên VPS:**
   - Để GitHub Actions có quyền kết nối vào VPS, bạn cần copy nội dung Public Key của cặp SSH Key mà bạn định cấu hình vào file `/root/.ssh/authorized_keys` trên VPS.
   - Kiểm tra xem SSH Key có thể kết nối được không bằng cách thử SSH từ local trước.

---

## 4. Kiểm Tra Tự Động & Kiểm Thử
* **Xác minh cú pháp:** Pipeline sẽ tự động kiểm tra biên dịch Java/Maven trên Backend và biên dịch Next.js trên Frontend ở job `build-and-test`. Nếu xảy ra lỗi cú pháp, pipeline sẽ dừng ngay lập tức và báo lỗi trên GitHub Actions.
* **Xác minh Healthcheck:** Job `deploy` sẽ chỉ kết thúc thành công khi cả 4 container chạy thông qua lệnh kiểm tra `health=healthy`. Nếu bất kỳ dịch vụ nào crash hoặc không vượt qua kiểm tra sức khỏe, job sẽ dừng lại và chuyển trạng thái build thành **Failed** để thông báo cho đội ngũ phát triển.
