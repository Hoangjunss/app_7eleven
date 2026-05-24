# 🚀 Sub-Agent 08 — Production Readiness Review

## Mục đích
Đánh giá code có sẵn sàng cho môi trường production không: deployment, monitoring, scalability, resilience.

---

## 1. Environment & Configuration

### ❌ Dấu hiệu BAD
```typescript
// Bad: hardcoded environment-specific values
const API_URL = 'http://localhost:3000'; // sẽ fail trong production
const DB_HOST = 'localhost'; // sẽ fail trong production

// Bad: không validate required env variables khi startup
const app = createApp(); // start dù thiếu config, lỗi xảy ra lúc runtime

// Bad: code path khác nhau giữa dev và prod không được document
if (process.env.NODE_ENV !== 'production') {
  // logic phức tạp chỉ trong dev
}
```

### ✅ Config Management
```typescript
// Good: validate env variables khi app start (fail fast)
import { z } from 'zod';

const EnvSchema = z.object({
  // App
  NODE_ENV: z.enum(['development', 'staging', 'production']),
  PORT: z.string().transform(Number).pipe(z.number().min(1).max(65535)),
  
  // Database
  DATABASE_URL: z.string().url(),
  DB_POOL_MIN: z.string().transform(Number).default('2'),
  DB_POOL_MAX: z.string().transform(Number).default('10'),
  
  // Auth
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  
  // External services
  REDIS_URL: z.string().url(),
  SENDGRID_API_KEY: z.string().startsWith('SG.'),
  
  // Optional với defaults
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

// Validate khi app start, crash sớm nếu thiếu config
const env = EnvSchema.parse(process.env);
// Nếu thiếu DB_URL → crash ngay khi start với error rõ ràng
// Tốt hơn crash vào lúc có request đầu tiên

export type Env = z.infer<typeof EnvSchema>;
```

**Câu hỏi review Config:**
- [ ] Có hardcoded URLs, credentials, hoặc environment-specific values không?
- [ ] Required env variables có được validate khi startup không?
- [ ] `.env` file có được gitignore không?
- [ ] Có `.env.example` để document required variables không?

---

## 2. Graceful Shutdown

```typescript
// ❌ Không handle graceful shutdown
// Kubernetes/Docker stop → process kill → in-flight requests bị drop
// DB transactions bị rollback giữa chừng
// Message queue messages bị mất

// ✅ Graceful shutdown
const server = app.listen(port, () => {
  logger.info(`Server running on port ${port}`);
});

async function gracefulShutdown(signal: string) {
  logger.info(`Received ${signal}, starting graceful shutdown...`);
  
  // 1. Stop accepting new requests
  server.close(() => {
    logger.info('HTTP server closed');
  });
  
  // 2. Wait for in-flight requests to complete (timeout 30s)
  await new Promise(resolve => setTimeout(resolve, 30000));
  
  // 3. Close DB connections
  await sequelize.close();
  logger.info('Database connections closed');
  
  // 4. Close Redis connections
  await redis.quit();
  logger.info('Redis connection closed');
  
  // 5. Flush remaining logs
  await logger.flush();
  
  logger.info('Graceful shutdown complete');
  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error });
  gracefulShutdown('uncaughtException').finally(() => process.exit(1));
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', { reason });
  gracefulShutdown('unhandledRejection').finally(() => process.exit(1));
});
```

**Câu hỏi review Graceful Shutdown:**
- [ ] Có xử lý SIGTERM/SIGINT không?
- [ ] DB, Redis connections có được đóng clean không?
- [ ] In-flight requests có được wait complete không?
- [ ] Uncaught exceptions có được handle không?

---

## 3. Health Checks & Readiness

```typescript
// ✅ Health check endpoint cho Kubernetes/load balancer
@Get('/health')
async healthCheck(): Promise<HealthCheckResult> {
  const checks = await Promise.allSettled([
    this.checkDatabase(),
    this.checkRedis(),
    this.checkExternalApis(),
  ]);
  
  const results = {
    status: 'ok' as 'ok' | 'degraded' | 'error',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || 'unknown',
    checks: {
      database: checks[0].status === 'fulfilled' ? 'ok' : 'error',
      redis: checks[1].status === 'fulfilled' ? 'ok' : 'error',
      externalApis: checks[2].status === 'fulfilled' ? 'ok' : 'degraded',
    },
  };
  
  // Nếu bất kỳ critical check nào fail → 503 Service Unavailable
  const hasCriticalFailure = checks[0].status === 'rejected' || checks[1].status === 'rejected';
  
  return {
    statusCode: hasCriticalFailure ? 503 : 200,
    body: results,
  };
}

// Readiness vs Liveness (Kubernetes)
// /health/live  → app đang chạy không? (restart nếu fail)
// /health/ready → app sẵn sàng nhận request không? (remove từ LB nếu fail)
@Get('/health/live')
liveness() { return { status: 'alive' }; }

@Get('/health/ready')
async readiness() {
  await this.db.query('SELECT 1'); // check DB connection
  return { status: 'ready' };
}
```

---

## 4. Observability (Monitoring & Alerting)

```typescript
// ✅ Structured logging với correlation ID
import { randomUUID } from 'crypto';

// Middleware gán request ID
app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] as string || randomUUID();
  res.setHeader('x-request-id', req.id);
  next();
});

// Log mỗi request với context đầy đủ
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    logger.info('HTTP Request', {
      requestId: req.id,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: Date.now() - start,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
      userId: req.user?.id,
    });
  });
  
  next();
});

// ✅ Metrics (Prometheus format)
import { Counter, Histogram, Registry } from 'prom-client';

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
});

const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});
```

**Câu hỏi review Observability:**
- [ ] Có request ID/correlation ID không?
- [ ] Request log có đủ thông tin (method, path, status, duration) không?
- [ ] Có metrics endpoint (/metrics) không?
- [ ] Error có được alert không (Sentry, Datadog, ...)?

---

## 5. Resilience Patterns

### Circuit Breaker
```typescript
// ❌ Không có circuit breaker: external service chậm → cascade failure
async function getShippingRate(order: Order) {
  return fetch('https://shipping-api.com/rates', { ... });
  // Nếu shipping-api down → mỗi request đợi timeout → thread pool exhausted
}

// ✅ Circuit Breaker pattern
import CircuitBreaker from 'opossum';

const shippingCircuitBreaker = new CircuitBreaker(fetchShippingRate, {
  timeout: 3000,       // fail nếu > 3 giây
  errorThresholdPercentage: 50,  // open nếu 50% requests fail
  resetTimeout: 30000, // thử lại sau 30 giây
});

shippingCircuitBreaker.fallback(() => ({
  rate: null,
  message: 'Shipping rate temporarily unavailable',
}));

async function getShippingRate(order: Order) {
  return shippingCircuitBreaker.fire(order);
}
```

### Feature Flags
```typescript
// ✅ Feature flags cho gradual rollout
async function processCheckout(order: Order, userId: string) {
  // Roll out new payment flow cho 10% users
  const useNewPaymentFlow = await featureFlags.isEnabled(
    'new_payment_flow',
    { userId }
  );
  
  if (useNewPaymentFlow) {
    return this.newPaymentService.process(order);
  }
  
  return this.legacyPaymentService.process(order);
}
```

**Câu hỏi review Resilience:**
- [ ] Calls đến external services có timeout không?
- [ ] Có circuit breaker cho external dependencies không?
- [ ] Có fallback/degraded mode khi service không available không?
- [ ] Có retry với backoff không?

---

## 6. Database Migration & Backward Compatibility

```typescript
// ❌ Breaking migration khi deploy
// Migration: xoá column đang được code dùng
ALTER TABLE users DROP COLUMN legacy_field;
// Deploy code trước khi migration → crash
// Migration trước deploy → code cũ dùng field đã xoá → crash

// ✅ Expand-Contract pattern
// Phase 1 (deploy cùng với code mới):
// Add new column, old code vẫn hoạt động
ALTER TABLE users ADD COLUMN new_field VARCHAR(255);

// Code mới viết vào cả old_field và new_field

// Phase 2 (sau khi phase 1 ổn định):
// Migration data
UPDATE users SET new_field = old_field WHERE new_field IS NULL;

// Phase 3 (sau khi xác nhận data đúng):
// Remove old code + old column
ALTER TABLE users DROP COLUMN old_field;
```

**Câu hỏi review Migration:**
- [ ] Migration có backward compatible không (không break đang chạy code)?
- [ ] Migration có idempotent không (có thể chạy lại)?
- [ ] Migration có rollback plan không?
- [ ] Index được tạo với CONCURRENT để không lock table không?
