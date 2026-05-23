# Kế Hoạch Docker Đa Môi Trường (Dev & Prod) Cho 7Eleven Shop

Tài liệu này chi tiết cấu hình container hóa (Docker) cho toàn bộ dự án, bao gồm Spring Boot Backend (cổng 8080) và Next.js Frontend (cổng 3000), hỗ trợ chạy linh hoạt trên cả môi trường phát triển (Development) và vận hành (Production).

---

## 1. Kiến Trúc Mạng & Điều Phối Hệ Thống (Network & Routing)

Tất cả các service được nối chung vào mạng bridge `app-network` được khai báo ở cuối file `docker-compose.yml`. Điều này cho phép:
- Các service giao tiếp nội bộ qua tên container (`shop-backend`, `shop-postgres`, `shop-redis`).
- Ví dụ: `frontend` gọi API backend qua `http://shop-backend:8080` (phía server) hoặc `http://localhost:8080` (phía client/browser).
- Backend kết nối DB qua `jdbc:postgresql://shop-postgres:5432/` và Redis qua `shop-redis:6379`.

---

## 2. Dockerfile Cho Backend (Spring Boot)
Vị trí: `backend/Dockerfile`

Sử dụng multi-stage build để giảm thiểu kích thước ảnh runtime (chỉ chứa JRE).
```dockerfile
# Stage 1: Build stage
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Run stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

---

## 3. Dockerfile Cho Frontend (Next.js Standalone)
Vị trí: `frontend/Dockerfile`

Sử dụng tính năng `standalone` build của Next.js giúp giảm thiểu kích thước image chạy Production từ vài GB xuống ~100MB.
```dockerfile
# Stage 1: Install dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# Stage 2: Rebuild the source code
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1

# Nhận build-time argument truyền từ Docker Compose
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

# Stage 3: Production runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Chỉ sao chép các tài nguyên cần thiết cho chế độ standalone
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

---

## 4. Cấu Hình docker-compose.yml (Base Config)
Vị trí: `docker-compose.yml`

Bao gồm cấu hình base chạy trong môi trường **Production**. Tích hợp healthcheck cho tất cả dịch vụ và cấu hình mạng cô lập.

```yaml
version: '3.8'

services:
  postgres-db:
    image: postgres:16-alpine
    container_name: shop-postgres
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - "${DB_PORT}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $$POSTGRES_USER -d $$POSTGRES_DB"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - app-network

  redis-cache:
    image: redis:7-alpine
    container_name: shop-redis
    command: >
      sh -c "
      if [ -z \"${REDIS_PASSWORD}\" ]; then
        redis-server
      else
        redis-server --requirepass \"${REDIS_PASSWORD}\"
      fi
      "
    ports:
      - "${REDIS_PORT}:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: >
        sh -c "
        if [ -z \"${REDIS_PASSWORD}\" ]; then
          redis-cli ping
        else
          redis-cli -a \"${REDIS_PASSWORD}\" ping
        fi
        "
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - app-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: shop-backend
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=prod
      - DB_HOST=postgres-db
      - DB_PORT=5432
      - DB_NAME=${DB_NAME}
      - DB_USER=${DB_USER}
      - DB_PASSWORD=${DB_PASSWORD}
      - REDIS_HOST=shop-redis
      - REDIS_PORT=6379
      - REDIS_PASSWORD=${REDIS_PASSWORD}
      - JWT_SECRET=${JWT_SECRET}
      - CLOUDINARY_CLOUD_NAME=${CLOUDINARY_CLOUD_NAME}
      - CLOUDINARY_API_KEY=${CLOUDINARY_API_KEY}
      - CLOUDINARY_API_SECRET=${CLOUDINARY_API_SECRET}
    volumes:
      - ./backend/uploads:/app/uploads
    depends_on:
      postgres-db:
        condition: service_healthy
      redis-cache:
        condition: service_healthy
    healthcheck:
      test: ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1"]
      interval: 15s
      timeout: 10s
      retries: 5
    networks:
      - app-network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
    container_name: shop-frontend
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
      - HOSTNAME=0.0.0.0
      - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
    depends_on:
      backend:
        condition: service_healthy
    healthcheck:
      test: ["CMD-SHELL", "apk add --no-cache curl && curl -f http://localhost:3000 || exit 1"]
      interval: 15s
      timeout: 10s
      retries: 5
    networks:
      - app-network

volumes:
  postgres_data:
  redis_data:

networks:
  app-network:
    driver: bridge
```

---

## 5. Cấu Hình docker-compose.dev.yml (Development Override)
Vị trí: `docker-compose.dev.yml`

Ghi đè cấu hình để phục vụ phát triển, kích hoạt tính năng hot-reload và cấu hình dev profiles của Spring Boot.

```yaml
version: '3.8'

services:
  backend:
    environment:
      - SPRING_PROFILES_ACTIVE=dev # Sử dụng application-dev.yml
    volumes:
      - ./backend/src:/app/src # Mount source để phát triển
      - ./backend/uploads:/app/uploads

  frontend:
    command: npm run dev # Chạy dev mode để HMR (Hot Module Replacement)
    volumes:
      - ./frontend:/app # Mount frontend source code
      - /app/node_modules # Giữ cô lập node_modules trong container
      - /app/.next # Giữ cô lập build cache
```

---

## 6. Mẫu Cấu Hình Biến Môi Trường (.env templates)

### 6.1 File .env.dev.example
```ini
# Database Config
DB_PORT=5432
DB_NAME=shopdb
DB_USER=postgres
DB_PASSWORD=dev_strong_db_password

# Redis Config
REDIS_PORT=6379
REDIS_PASSWORD=dev_strong_redis_password

# Spring Boot Environment
SPRING_PROFILE=dev
JWT_SECRET=dev_extremely_long_jwt_secret_signing_key_32_bytes_long

# Cloudinary Storage
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Frontend URLs
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 6.2 File .env.prod.example
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

## 7. Các Script Khởi Chạy (Scripts)

### 7.1 Linux/Mac OS bash scripts (Đặt tại thư mục `scripts/`)

#### Thích hợp cho DEV: `scripts/run-dev.sh`
```bash
#!/bin/bash
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "Checking environment file .env.dev..."
if [ ! -f .env.dev ]; then
    echo "Warning: .env.dev file not found!"
    if [ -f .env.dev.example ]; then
        echo "Copying from .env.dev.example to .env.dev..."
        cp .env.dev.example .env.dev
        echo "Please verify and update .env.dev as needed before running."
    else
        echo "Error: .env.dev.example file not found!"
        exit 1
    fi
fi

echo "Starting development environment using Docker Compose..."
docker compose -f docker-compose.yml -f docker-compose.dev.yml --env-file .env.dev up --build
```

#### Thích hợp cho PROD: `scripts/run-prod.sh`
```bash
#!/bin/bash
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "Checking environment file .env.prod..."
if [ ! -f .env.prod ]; then
    echo "Warning: .env.prod file not found!"
    if [ -f .env.prod.example ]; then
        echo "Copying from .env.prod.example to .env.prod..."
        cp .env.prod.example .env.prod
        echo "Please verify and update .env.prod as needed before running."
    else
        echo "Error: .env.prod.example file not found!"
        exit 1
    fi
fi

echo "Starting production environment using Docker Compose (detached)..."
# Mẹo: Bỏ cờ --build nếu bạn chỉ khởi chạy lại container hiện có mà không có code thay đổi.
docker compose -f docker-compose.yml --env-file .env.prod up --build -d
```

---

### 7.2 Windows Batch scripts (Đặt tại thư mục `scripts/`)

#### Thích hợp cho DEV: `scripts/run-dev.bat`
```cmd
@echo off
cd /d "%~dp0\.."

echo Checking environment file .env.dev...
if not exist .env.dev (
    echo Warning: .env.dev file not found!
    if exist .env.dev.example (
        echo Copying from .env.dev.example to .env.dev...
        copy .env.dev.example .env.dev
        echo Please verify and update .env.dev as needed before running.
    ) else (
        echo Error: .env.dev.example file not found!
        exit /b 1
    )
)

echo Starting development environment using Docker Compose...
docker compose -f docker-compose.yml -f docker-compose.dev.yml --env-file .env.dev up --build
pause
```

#### Thích hợp cho PROD: `scripts/run-prod.bat`
```cmd
@echo off
cd /d "%~dp0\.."

echo Checking environment file .env.prod...
if not exist .env.prod (
    echo Warning: .env.prod file not found!
    if exist .env.prod.example (
        echo Copying from .env.prod.example to .env.prod...
        copy .env.prod.example .env.prod
        echo Please verify and update .env.prod as needed before running.
    ) else (
        echo Error: .env.prod.example file not found!
        exit /b 1
    )
)

echo Starting production environment using Docker Compose (detached)...
docker compose -f docker-compose.yml --env-file .env.prod up --build -d
pause
```

---

## 8. Hướng Dẫn Sử Dụng & Kiểm Tra (Usage & Verification)

### Bước 1: Khởi chạy môi trường
1. Để chạy môi trường phát triển (Dev):
   ```bash
   chmod +x scripts/run-dev.sh
   ./scripts/run-dev.sh
   ```
   Hoặc trên Windows, kích đúp chuột vào `scripts/run-dev.bat`.

2. Để chạy môi trường vận hành (Prod):
   ```bash
   chmod +x scripts/run-prod.sh
   ./scripts/run-prod.sh
   ```
   Hoặc chạy `scripts/run-prod.bat` on Windows.

### Bước 2: Kiểm tra trạng thái các container
Sau khi chạy các container, sử dụng lệnh sau để kiểm tra trạng thái hoạt động:
```bash
docker ps
```
Xác minh cột **STATUS** hiển thị dạng `(healthy)` cho tất cả các container:
- `shop-postgres` (healthy)
- `shop-redis` (healthy)
- `shop-backend` (healthy)
- `shop-frontend` (healthy)

### Bước 3: Xem Log hệ thống
Để kiểm tra xem hệ thống hoạt động chính xác không hoặc debug khi có lỗi:
```bash
# Xem log của backend
docker compose logs -f backend

# Xem log của frontend
docker compose logs -f frontend
```
