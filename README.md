# 7Eleven Shop – E‑commerce Platform (Test Fresher Java)

[![Java](https://img.shields.io/badge/Java-21-orange?logo=openjdk&logoColor=white)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.x-brightgreen?logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-red?logo=redis&logoColor=white)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-Compose-blue?logo=docker&logoColor=white)](https://www.docker.com/)

A modern, high-performance, monolithic E-commerce platform built for the **7Eleven Java Fresher Developer** test. The system features a responsive customer-facing storefront and a comprehensive administration dashboard, all deployed on a cloud VPS via Docker.

---

## 📋 General Information

| Attribute | Details |
| :--- | :--- |
| **Project Name** | **7Eleven Shop** |
| **Candidate Name** | **Vũ Hoàng Chung** |
| **Position** | **Fresher Java Developer** |
| **Target Company** | **7Eleven** |
| **Completion Date**| **May 24, 2026** |

---

## 🌐 Live Demo & Credentials

The application is deployed on a cloud VPS. You can test both the customer store and the admin portal directly using the links below:

* **Customer Store:** [https://test7eleven.online](https://test7eleven.online)
* **Admin Dashboard:** [https://admin.test7eleven.online](https://admin.test7eleven.online)

### 🔑 Demo Accounts

Use the credentials below to log into the respective interfaces:

| Role | Email | Password | Target Interface |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@7eleven.com` | `admin123` | Admin Dashboard & Customer Store |
| **User 1** | `user1@example.com` | `user123` | Customer Store |
| **User 2** | `user2@example.com` | `user123` | Customer Store |

> 💡 **Notice:** Both environments are production-ready. You do not need to perform any local installation to evaluate the platform.

---

## 🚀 Project Overview

The objective of this project is to build a monolithic, production-grade e-commerce application focusing on product browsing, shopping cart operations, checkout processing, order lifecycle tracking, and data-driven administrative controls.

* **Timeline:** MVP completed in **5 days** (1-person team).
* **Architecture:** Monolithic containerized application utilizing **Spring Boot** for the backend API services and **Next.js** for the frontend user interfaces.

---

## 🛠️ Technology Stack

### Backend
* **Language & Core:** Java 21, Spring Boot 3.2.x
* **Security:** Spring Security, stateless JWT authentication (7-day validity token)
* **Persistence:** Spring Data JPA, Hibernate, PostgreSQL 16
* **Cache:** Redis 7 (specifically for high-performance shopping cart management)
* **Migrations:** Flyway for automated database schema version control
* **Auditing:** Custom Aspect-Oriented Programming (AOP) logging table changes and actor transactions into `audit_logs` in PostgreSQL
* **Other Utilities:** MapStruct (DTO mapping), Lombok, Cloudinary Java SDK (image cloud management)

### Frontend
* **Core:** Next.js 14 (App Router), TypeScript
* **Styling:** Tailwind CSS, shadcn/ui components
* **State Management:** Zustand
* **Data Fetching:** React Query (TanStack Query), Axios
* **Charts & Visuals:** Recharts

### DevOps & Infrastructure
* **Containerization:** Docker, Docker Compose
* **Web Server:** Nginx (acting as a reverse proxy, SSL termination, and static asset server)
* **SSL Certificates:** Let's Encrypt SSL
* **Hosting:** VPS (Ubuntu Server)

---

## ✨ Core Features

### 🛒 Customer Storefront (User Flow)
* **User Authentication:** 
  * Seamless sign-up, login, and logout flows.
  * Security is enforced using stateless **JWT (JSON Web Tokens)** stored in secure state.
  * Robust input validation (email format checks, password length requirements) handled both client-side and server-side.
* **Dynamic Product Catalog:** 
  * Advanced product navigation displaying active products only.
  * Server-side pagination (`?page=X&size=Y`) preventing massive data transfer overhead.
  * High-performance search powered by PostgreSQL `ILIKE` / `pg_trgm` indexes for fast fuzzy matching.
  * Multiple filtering options: Category hierarchies (supports parent-child node filtering) and a dynamic price range slider.
  * Sorting options (price low-to-high, price high-to-low, newest arrivals).
* **Detailed Product Presentation:** 
  * Clean, interactive product page with multi-image gallery carousels.
  * Real-time stock status display (checking inventory levels dynamically).
  * Safe multi-buy support: Backend uses **JPA `@Version` Optimistic Locking** to ensure stock accuracy and prevent race conditions when concurrent checkouts happen.
* **Interactive Shopping Cart:** 
  * Flyout side-drawer cart design with smooth CSS micro-animations.
  * Multi-item addition, dynamic increment/decrement, and inline deletion.
  * **Redis-Backed Session Caching:** Carts are cached inside a dedicated Redis instance for low latency and sub-second cart read/write response times.
* **Structured Checkout:** 
  * Clean, multi-step checkout form to collect client shipment parameters (recipient name, validated phone number, detailed address).
  * Integrates database transaction safety: Automatically decrements stock levels, processes order state, and invalidates/clears active Redis carts upon successful COD order validation.
* **Order History Tracker:** 
  * Secure list of client orders with color-coded status badges.
  * Filter order lists by state: `PENDING`, `CONFIRMED`, `SHIPPING`, `DELIVERED`, and `CANCELLED`.
  * Allows self-cancellation for any order still in the `PENDING` phase.

### 📊 Administration Console (Admin Flow)
* **Data-Rich Analytics Dashboard:** 
  * **KPI Summary Cards:** Displays key metrics like total aggregated revenue, active orders count, total registered users, and active product stock volumes.
  * **Interactive Analytics Charts:** Displays dynamic area/line charts representing daily/monthly revenue trends (powered by Recharts).
  * **Ranked Inventory Metrics:** Visualizes top-selling products using custom interactive bar charts.
  * **Real-time Order Feed:** Highlights the latest incoming orders for quick shipping handling.
* **Product Management (CRUD):** 
  * Admin panel for creating, updating, viewing, and soft-deleting products.
  * Multi-image drag-and-drop file uploader.
  * **Cloudinary Integration:** Automatically uploads, compresses, and serves assets securely from Cloudinary's content delivery network (CDN).
  * Interactive tool to set any uploaded image as the product's primary cover thumbnail.
* **Category Management (CRUD):** 
  * Simplified management panel for e-commerce categories.
  * Supports creating parent-child relationships, allowing nested sub-category categorization.
* **User Accounts Directory:** 
  * Admin-wide access list of all registered user database profiles.
  * Immediate user state controls (enables freezing/locking active users or unlocking accounts).
  * Dynamic role assignments, enabling demotions or elevations to `ROLE_ADMIN` status.
* **Order Processing Workflow:** 
  * Unified manager view of all user checkouts with multi-filter controls (order status, date ranges).
  * Sequential state transition control machine: `PENDING` ➔ `CONFIRMED` ➔ `SHIPPING` ➔ `DELIVERED` or `CANCELLED`.
  * Detailed order invoice breakdown (shipping details, line-item quantities, sub-total, and audit history).
* **Enterprise Security & Audit Logging:** 
  * **AOP-Based Auditing System:** Custom Spring Aspect-Oriented Programming wrapper intercepting all critical administrative action calls.
  * Logs transaction detail maps (containing actor email, actor role, targeted entity ID, database operation details, client IP address, and browser User-Agent) directly into the `audit_logs` table for compliance checks.

---

## 📁 Directory Structure

```text
7eleven/
├── backend/                    # Spring Boot Application
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/_eleven/shop/
│   │   │   │   ├── aspect/     # AOP Audit Logger
│   │   │   │   ├── config/     # App Configuration (Redis, Security, Cloudinary)
│   │   │   │   ├── controller/ # REST Endpoints
│   │   │   │   ├── dto/        # Request/Response Data Transfer Objects
│   │   │   │   ├── entity/     # Hibernate JPA Entities (PostgreSQL)
│   │   │   │   ├── exception/  # RFC 7807 Problem Detail Handlers
│   │   │   │   ├── mapper/     # MapStruct Converters
│   │   │   │   ├── repository/ # Database Repositories
│   │   │   │   ├── security/   # JWT Filter & Configurations
│   │   │   │   └── service/    # Core Business Logic
│   │   │   └── resources/
│   │   │       ├── db/migration/ # Flyway Database Scripts
│   │   │       └── application-prod.yml
│   │   └── test/               # JUnit Integration and Unit Tests
│   ├── Dockerfile
│   └── pom.xml
│
├── frontend/                   # Next.js Application
│   ├── src/
│   │   ├── app/                # App Router Pages (Store & Admin)
│   │   ├── components/         # Reusable Custom & shadcn/ui Components
│   │   ├── hooks/              # Custom React Hooks
│   │   ├── lib/                # Client configurations & HTTP instance
│   │   ├── services/           # Axios API Client Requests
│   │   └── stores/             # Zustand State Stores
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml          # Production multi-container composition orchestrator
└── .env.prod.example           # Shared environment variables template
```

---

## 🔌 API Endpoints Summary

All APIs conform to RESTful guidelines and are prefixed with `/api/v1/`.

| Group | Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Authentication** | `POST` | `/api/v1/auth/register` | Public | Sign up a new user |
| | `POST` | `/api/v1/auth/login` | Public | Sign in and retrieve JWT token |
| | `POST` | `/api/v1/auth/logout` | Public | Terminate session |
| **Products** | `GET` | `/api/v1/products` | Public | Paginated product list (filter & search) |
| | `GET` | `/api/v1/products/{id}` | Public | Detailed product view |
| **Cart** | `GET` | `/api/v1/cart` | User / Admin | View cart items (cached in Redis) |
| | `POST` | `/api/v1/cart/items` | User / Admin | Add item to cart |
| | `PUT` | `/api/v1/cart/items/{productId}` | User / Admin | Modify item quantity |
| | `DELETE`| `/api/v1/cart/items/{productId}` | User / Admin | Remove item from cart |
| **Orders** | `POST` | `/api/v1/orders` | User / Admin | Place order |
| | `GET` | `/api/v1/orders` | User / Admin | List user orders |
| | `PATCH`| `/api/v1/orders/{id}/cancel` | User / Admin | Cancel a PENDING order |
| **Admin Panel** | `GET` | `/api/v1/admin/dashboard/kpi` | Admin | Fetch dashboard general statistics |
| | `GET` | `/api/v1/admin/dashboard/revenue` | Admin | Fetch analytics revenue logs |
| | `POST` | `/api/v1/admin/products` | Admin | Create product |
| | `PUT` | `/api/v1/admin/products/{id}`| Admin | Edit product details |
| | `DELETE`| `/api/v1/admin/products/{id}`| Admin | Delete product (soft delete) |
| | `PATCH`| `/api/v1/admin/orders/{id}/status` | Admin | Transition order lifecycle status |
| | `GET` | `/api/v1/admin/users` | Admin | View user accounts lists |
| | `PATCH`| `/api/v1/admin/users/{id}/roles` | Admin | Modify user authority permissions |

---

## ⚙️ Local Setup Guide

Follow the steps below to run the environment locally.

### Prerequisites
* **Java 21** (JDK 21)
* **Node.js 20+**
* **Docker** & **Docker Compose**
* **Git**

### Step 1: Clone the Repository
```bash
git clone https://github.com/Hoangjunss/app_7eleven.git
cd app_7eleven
```

### Step 2: Configure Environment Variables
Create a `.env.prod` file in the root directory by copying the configuration from `.env.prod.example`:
```bash
cp .env.prod.example .env.prod
```

Modify the environment configurations in `.env.prod`. Below is a sample configuration:
```env
SPRING_PROFILE=prod
DB_NAME=seven_eleven_prod
DB_USER=postgres_prod
DB_PASSWORD=your_strong_password
DB_PORT=5432
REDIS_PORT=6379
REDIS_PASSWORD=change_me
JWT_SECRET=your_secure_jwt_secret_should_be_at_least_32_characters_long

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
CORS_ALLOWED_ORIGINS=https://test7eleven.online,https://admin.test7eleven.online,http://localhost:3000,http://103.72.99.211:3000
```

### Step 3: Run the Application with Docker Compose
Run the entire orchestration stack in detached mode:
```bash
docker compose up --build -d
```
Docker Compose will download the required images (PostgreSQL 16, Redis 7, Nginx) and compile the `backend` and `frontend` images. Once ready, standard ports will map as:
* Frontend client: `http://localhost:3000`
* Backend API: `http://localhost:8080`

---

## 🧪 Testing

### Backend
Run unit and integration testing suite:
```bash
cd backend
./mvnw test
```
* **Test Status:** **48/48 tests successfully passed** (covering controller request verification, service logical conditions, security filter rules, and mapper conversions).

### Frontend
Execute testing suite for Next.js interface components:
```bash
cd frontend
npm run test
```

---

## 🛑 Limitations & Phase 2 Roadmap

### Current Limitations (MVP Phase)
* **Payments:** Supports Cash on Delivery (COD) only.
* **Notifications:** Lacks direct transaction email triggers and real-time push alerts.
* **Search Optimization:** Catalog searches rely directly on database querying instead of index caching.
* **CI/CD:** Basic Docker commands are executed directly on target server without structured workflows.

### Phase 2 Plan (Upcoming Features)
* **Online Payments:** Connect VNPay or Momo checkout gateways.
* **Message Broker:** Implement RabbitMQ/Kafka to dispatch transaction emails and system audit logs asynchronously.
* **Search Engine:** Introduce Elasticsearch to index catalogs and power autocomplete query processing.
* **Observability:** Integrate Prometheus and Grafana metrics to supervise application and resource health.
