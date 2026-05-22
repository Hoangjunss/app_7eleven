---
trigger: always_on
---

# Tech Stack - Chỉ được dùng

- **Backend:** Spring Boot 3.2+, Java 21, Maven
- **Database:** PostgreSQL 16 (chính) + Redis 7 (chỉ cho cart)
- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Auth:** JWT (access token 7 ngày, không refresh)
- **Audit:** AOP + bảng audit_logs trong PostgreSQL
- **Deploy:** Docker Compose, không CI/CD

## Cấm tuyệt đối
- RabbitMQ, Kafka, ActiveMQ
- MongoDB, Elasticsearch, Cassandra
- Gửi email (JavaMail, SendGrid, …)
- Multiple backend instances (chỉ 1 instance)
- WebSocket, SSE
- OAuth2, Refresh token, Blacklist