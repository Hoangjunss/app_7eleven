# Kế Hoạch Phase 9: CI/CD Pipeline (GitHub Actions)

Tài liệu này chi tiết kế hoạch thiết lập hệ thống tích hợp liên tục (CI) và triển khai liên tục (CD) tự động sử dụng GitHub Actions, GitHub Packages Container Registry (GHCR) và Docker Compose.

---

## Git Setup
```bash
git checkout develop
git pull origin develop
git checkout -b feature/ci-cd-pipeline
```
*Commit convention:* `<type>(ci): <subject>` (ví dụ: `feat(ci): add backend CI workflow`)

---

## Danh Sách Tasks

### Task 1: Cấu hình CI cho Backend
- **Task 1.1: Tạo file `backend/src/test/resources/application-test.yml`**
  - Đảm bảo môi trường chạy test độc lập dùng H2 database, tắt Flyway để tối ưu tốc độ.
- **Task 1.2: Tạo workflow `.github/workflows/ci-backend.yml`**
  - Kích hoạt khi có `push` hoặc `pull_request` liên quan đến thư mục `backend/**`.
  - Sử dụng Java 21, cache Maven repository để tăng tốc độ build.
  - Job `test` chạy lệnh `mvn test`.
  - Job `build-and-push` (chỉ chạy trên nhánh `main` hoặc `develop` khi test pass):
    - Cần quyền `packages: write` để push lên GHCR.
    - Build Docker image backend và push lên GHCR.
    - Tags: `latest` cho `main`, `develop-{sha}` và `develop` cho `develop`.

### Task 2: Cấu hình CI cho Frontend
- **Task 2.1: Tạo workflow `.github/workflows/ci-frontend.yml`**
  - Kích hoạt khi có `push` hoặc `pull_request` liên quan đến thư mục `frontend/**`.
  - Sử dụng Node.js 20, cache `node_modules` để tối ưu hóa thời gian chạy.
  - Job `test` chạy lệnh `CI=true npm test -- --coverage` để chạy kiểm thử nghiêm ngặt không có watch-mode và thu thập báo cáo độ phủ.
  - Job `build-and-push` (chỉ chạy trên nhánh `main` hoặc `develop` khi test pass):
    - Nhận `NEXT_PUBLIC_API_URL` làm build-time argument truyền qua `--build-arg`.
    - Build Docker image và push lên GHCR với các tag tương ứng (`latest` hoặc `develop-{sha}`).

### Task 3: Triển khai CD tự động lên Production VPS
- **Task 3.1: Tạo workflow `.github/workflows/cd-deploy.yml`**
  - Kích hoạt khi push lên nhánh `main` (sau khi CI thành công).
  - SSH vào VPS qua `appleboy/ssh-action`:
    - Truyền `GITHUB_TOKEN` và `GITHUB_ACTOR` thông qua biến môi trường để đăng nhập GHCR trên VPS.
    - Kiểm tra xem file `docker-compose.yml` và `.env.prod` đã tồn tại trên server chưa. Nếu chưa có, báo lỗi dừng deploy.
    - Đăng nhập GHCR và chạy `docker compose pull` & `docker compose up -d --remove-orphans`.

### Task 4: Hướng dẫn cấu hình Secrets & Triển khai lần đầu
- **Task 4.1: Tạo file hướng dẫn `CI_CD_SECRETS_GUIDE.md`**
  - Chi tiết danh sách secrets cần cấu hình trên GitHub Repo.
  - Hướng dẫn thiết lập thư mục và copy thủ công các file cấu hình (`docker-compose.yml`, `.env.prod`) lên VPS trước lần deploy đầu tiên.

---

## Chi Tiết Cấu Hình Các File

### 1. File Cấu Hình Test Backend
Vị trí: `backend/src/test/resources/application-test.yml`
```yaml
spring:
  datasource:
    url: jdbc:h2:mem:shop_test;DB_CLOSE_DELAY=-1;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE
    username: sa
    password:
    driver-class-name: org.h2.Driver
  jpa:
    hibernate:
      ddl-auto: create-drop
    show-sql: true
    properties:
      hibernate:
        dialect: org.hibernate.dialect.H2Dialect
        format_sql: true
  data:
    redis:
      repositories:
        enabled: false
  flyway:
    enabled: false # Tắt migrations trong test để tránh lỗi không tương thích SQL của H2
jwt:
  secret: devsecretkeydevsecretkeydevsecretkeydevsecretkeydevsecretkey
  expiration: 604800
```

### 2. Workflow CI Backend
Vị trí: `.github/workflows/ci-backend.yml`
```yaml
name: Backend CI

on:
  push:
    branches: [ main, develop ]
    paths:
      - 'backend/**'
      - '.github/workflows/ci-backend.yml'
  pull_request:
    branches: [ main, develop ]
    paths:
      - 'backend/**'
      - '.github/workflows/ci-backend.yml'

jobs:
  test:
    name: Run Unit Tests
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
          cache-dependency-path: 'backend/pom.xml'

      - name: Run Maven Test
        run: |
          cd backend
          mvn clean test

  build-and-push:
    name: Build & Push Docker Image
    needs: test
    if: github.event_name == 'push' && (github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop')
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Downcase Repository Owner Name
        run: |
          echo "REPO_OWNER=${OWNER,,}" >> $GITHUB_ENV
        env:
          OWNER: ${{ github.repository_owner }}

      - name: Get Short SHA
        run: |
          echo "SHORT_SHA=${GITHUB_SHA::7}" >> $GITHUB_ENV

      - name: Determine Docker Tags
        run: |
          if [ "${{ github.ref }}" = "refs/heads/main" ]; then
            echo "TAGS=ghcr.io/${{ env.REPO_OWNER }}/7eleven-backend:latest" >> $GITHUB_ENV
          else
            echo "TAGS=ghcr.io/${{ env.REPO_OWNER }}/7eleven-backend:develop,ghcr.io/${{ env.REPO_OWNER }}/7eleven-backend:develop-${{ env.SHORT_SHA }}" >> $GITHUB_ENV
          fi

      - name: Build and Push Docker Image
        uses: docker/build-push-action@v5
        with:
          context: ./backend
          file: ./backend/Dockerfile
          push: true
          tags: ${{ env.TAGS }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

### 3. Workflow CI Frontend
Vị trí: `.github/workflows/ci-frontend.yml`
```yaml
name: Frontend CI

on:
  push:
    branches: [ main, develop ]
    paths:
      - 'frontend/**'
      - '.github/workflows/ci-frontend.yml'
  pull_request:
    branches: [ main, develop ]
    paths:
      - 'frontend/**'
      - '.github/workflows/ci-frontend.yml'

jobs:
  test:
    name: Run Jest Tests
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: 'frontend/package-lock.json'

      - name: Install Dependencies
        run: |
          cd frontend
          npm ci --legacy-peer-deps

      - name: Run Tests with Coverage
        run: |
          cd frontend
          CI=true npm test -- --coverage

  build-and-push:
    name: Build & Push Docker Image
    needs: test
    if: github.event_name == 'push' && (github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop')
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Downcase Repository Owner Name
        run: |
          echo "REPO_OWNER=${OWNER,,}" >> $GITHUB_ENV
        env:
          OWNER: ${{ github.repository_owner }}

      - name: Get Short SHA
        run: |
          echo "SHORT_SHA=${GITHUB_SHA::7}" >> $GITHUB_ENV

      - name: Determine Docker Tags
        run: |
          if [ "${{ github.ref }}" = "refs/heads/main" ]; then
            echo "TAGS=ghcr.io/${{ env.REPO_OWNER }}/7eleven-frontend:latest" >> $GITHUB_ENV
          else
            echo "TAGS=ghcr.io/${{ env.REPO_OWNER }}/7eleven-frontend:develop,ghcr.io/${{ env.REPO_OWNER }}/7eleven-frontend:develop-${{ env.SHORT_SHA }}" >> $GITHUB_ENV
          fi

      - name: Build and Push Docker Image
        uses: docker/build-push-action@v5
        with:
          context: ./frontend
          file: ./frontend/Dockerfile
          push: true
          build-args: |
            NEXT_PUBLIC_API_URL=${{ secrets.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1' }}
          tags: ${{ env.TAGS }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

### 4. Workflow CD Deploy
Vị trí: `.github/workflows/cd-deploy.yml`
```yaml
name: Production CD

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    name: Deploy to Production VPS
    runs-on: ubuntu-latest
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          port: ${{ secrets.SSH_PORT || 22 }}
          envs: GITHUB_TOKEN, GITHUB_ACTOR
          script: |
            cd ${{ secrets.DEPLOY_PATH }}
            
            # Kiểm tra xem các file cấu hình bắt buộc đã tồn tại chưa
            if [ ! -f docker-compose.yml ]; then
              echo "Lỗi: Không tìm thấy file docker-compose.yml trong thư mục ${{ secrets.DEPLOY_PATH }} trên VPS!"
              echo "Vui lòng copy file cấu hình này lên server trước."
              exit 1
            fi
            
            if [ ! -f .env.prod ]; then
              echo "Lỗi: Không tìm thấy file .env.prod trong thư mục ${{ secrets.DEPLOY_PATH }} trên VPS!"
              echo "Vui lòng cấu hình các biến môi trường sản xuất trước khi deploy."
              exit 1
            fi
            
            # Đăng nhập GHCR và pull image mới
            echo "$GITHUB_TOKEN" | docker login ghcr.io -u "$GITHUB_ACTOR" --password-stdin
            docker compose pull
            
            # Chạy lại các container
            docker compose up -d --remove-orphans
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          GITHUB_ACTOR: ${{ github.actor }}
```

---

## Hướng Dẫn Thiết Lập Secrets & Deploy Lần Đầu
Vị trí: `CI_CD_SECRETS_GUIDE.md`

### Bước 1: Cấu hình GitHub Actions Secrets
Truy cập vào Repository của bạn trên GitHub, vào **Settings > Secrets and variables > Actions > New repository secret** và thêm các biến sau:
1. `NEXT_PUBLIC_API_URL`: URL API backend ở môi trường Production (ví dụ: `https://api.7eleven.com/api/v1`).
2. `SSH_HOST`: IP Address của VPS Production.
3. `SSH_USERNAME`: Username để SSH vào VPS (ví dụ: `ubuntu` hoặc `root`).
4. `SSH_KEY`: Nội dung Private SSH Key tương ứng dùng để xác thực không cần mật khẩu.
5. `SSH_PORT`: Port SSH (mặc định là `22`).
6. `DEPLOY_PATH`: Thư mục dự án trên VPS nơi chứa file compose (ví dụ: `/home/ubuntu/7eleven`).

### Bước 2: Thiết lập thủ công trên VPS trước lần deploy đầu tiên
Trước khi CI/CD có thể tự động pull image và khởi chạy, bạn phải thực hiện các bước chuẩn bị sau trên VPS:
1. Tạo thư mục deploy trên VPS:
   ```bash
   mkdir -p /home/ubuntu/7eleven
   cd /home/ubuntu/7eleven
   ```
2. Copy file `docker-compose.yml` từ local lên VPS (trong thư mục `/home/ubuntu/7eleven/`).
3. Tạo file `.env.prod` trên VPS bằng cách copy từ `.env.prod.example` và cập nhật các mật khẩu, thông tin kết nối thực tế ở môi trường production.
4. Đảm bảo VPS đã cài đặt sẵn **Docker** và **Docker Compose**.

---

## Kế Hoạch Xác Minh (Verification Checklist)
- [ ] Chạy thử lệnh test cục bộ trên cả 2 folder backend/frontend để đảm bảo code test sạch lỗi.
- [ ] Push code lên nhánh `feature/ci-cd-pipeline` và tạo Pull Request vào `develop`. Xác nhận cả hai workflow CI (Backend & Frontend) được trigger và chạy thành công job `test`. Job `build-and-push` không được chạy (thỏa mãn điều kiện PR).
- [ ] Merge Pull Request vào nhánh `develop`. Xác nhận cả hai workflow CI chạy thành công cả 2 job `test` và `build-and-push`, thực hiện đẩy image lên GHCR dưới dạng package.
- [ ] Merge PR vào nhánh `main`. Xác nhận các image được đẩy lên GHCR với tag `latest` và trigger CD thành công (đã hoàn thành bước SSH VPS).
