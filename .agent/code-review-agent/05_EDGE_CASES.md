# 🔥 Sub-Agent 05 — Edge Cases & Error Handling Review

## Mục đích
Đây là sub-agent quan trọng nhất cho production readiness. Tìm kiếm các trường hợp biên và lỗi xử lý không đúng cách có thể gây crash hoặc data corruption trong production.

---

## 1. Input Edge Cases

### Checklist đầu vào bất ngờ
```typescript
// Luôn hỏi: điều gì xảy ra nếu input là...

// ❌ Không handle edge cases
function getUserAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const now = new Date();
  return now.getFullYear() - birth.getFullYear();
}

// Test các case:
getUserAge('')                    // → NaN
getUserAge('invalid-date')        // → NaN  
getUserAge('2099-01-01')          // → âm số?
getUserAge('1800-01-01')          // → > 200 tuổi?
getUserAge(null as any)           // → crash
getUserAge('2000-02-30')          // → invalid date
```

### ✅ Handle đầy đủ
```typescript
function getUserAge(birthDateStr: string): number {
  if (!birthDateStr) {
    throw new ValidationError('Birth date is required');
  }

  const birthDate = new Date(birthDateStr);
  
  if (isNaN(birthDate.getTime())) {
    throw new ValidationError(`Invalid date format: ${birthDateStr}`);
  }

  const now = new Date();
  
  if (birthDate > now) {
    throw new ValidationError('Birth date cannot be in the future');
  }

  const age = now.getFullYear() - birthDate.getFullYear();
  
  if (age > 150) {
    throw new ValidationError('Invalid birth date: age exceeds 150 years');
  }

  // Adjust for birthday not yet occurred this year
  const birthdayThisYear = new Date(now.getFullYear(), birthDate.getMonth(), birthDate.getDate());
  return birthdayThisYear > now ? age - 1 : age;
}
```

**Câu hỏi review Input Edge Cases:**
- [ ] Hàm có handle input là `null`, `undefined`, `''` (empty string) không?
- [ ] Hàm có handle input vượt giới hạn (số âm, số quá lớn) không?
- [ ] Date parsing có kiểm tra `isNaN` không?
- [ ] Array có kiểm tra empty array không?
- [ ] Pagination có handle page=0 hoặc page âm không?

---

## 2. Async & Race Conditions

### ❌ Dấu hiệu BAD
```typescript
// Bad: race condition khi check-then-act
async function withdraw(accountId: string, amount: number) {
  const account = await Account.findByPk(accountId);
  
  // ❌ TOCTOU (Time-Of-Check Time-Of-Use) race condition
  // Giữa check và update có thể có request khác cũng withdraw!
  if (account.balance < amount) {
    throw new Error('Insufficient funds');
  }
  
  await account.update({ balance: account.balance - amount }); // ❌ không atomic
}

// Scenario: 2 requests concurrent đều check balance = 1000
// Cả 2 đều pass check, cả 2 đều withdraw 800 → balance = -600!

// Bad: không handle timeout
const data = await fetch('https://external-api.com/data'); // hang mãi nếu API chậm

// Bad: retry không có backoff
while (retries < 3) {
  try {
    await callExternalApi();
    break;
  } catch {
    retries++;
    // ❌ retry ngay lập tức → có thể DDoS external service
  }
}
```

### ✅ Đúng cách
```typescript
// Good: atomic operation với transaction + lock
async function withdraw(accountId: string, amount: number) {
  return db.transaction(async (t) => {
    // SELECT FOR UPDATE: lock row, không có race condition
    const account = await Account.findByPk(accountId, {
      lock: t.LOCK.UPDATE,
      transaction: t,
    });

    if (!account) throw new NotFoundError(`Account ${accountId} not found`);
    if (account.balance < amount) throw new InsufficientFundsError();

    return account.update(
      { balance: account.balance - amount },
      { transaction: t }
    );
  });
}

// Good: timeout + AbortController
async function fetchWithTimeout(url: string, timeoutMs = 5000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new TimeoutError(`Request to ${url} timed out after ${timeoutMs}ms`);
    }
    throw error;
  }
}

// Good: exponential backoff retry
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 1000,
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Không retry nếu là lỗi client (4xx)
      if (error instanceof ApiError && error.status < 500) throw error;
      
      if (attempt < maxRetries - 1) {
        const delay = baseDelayMs * Math.pow(2, attempt) + Math.random() * 1000; // jitter
        await sleep(delay);
      }
    }
  }
  
  throw lastError!;
}
```

**Câu hỏi review Race Conditions:**
- [ ] Có pattern check-then-act trên shared resource không? (cần atomic operation)
- [ ] External API call có timeout không?
- [ ] Retry logic có exponential backoff không?
- [ ] Concurrent operation trên cùng resource có được protected không?

---

## 3. Numeric & Financial Edge Cases

### ❌ Dấu hiệu BAD
```typescript
// Bad: floating point arithmetic cho tiền
const total = 0.1 + 0.2; // → 0.30000000000000004 ❌
const price = 19.99;
const tax = price * 0.1; // → 1.9899999999999999 ❌

// Bad: không validate số âm cho số tiền
async function createOrder(price: number) {
  // price = -1000? → người dùng được tiền?
  await chargeCustomer(price); // ❌
}

// Bad: integer overflow với large numbers
const totalRevenue = users.reduce((sum, user) => sum + user.revenue, 0);
// Nếu dùng JavaScript Number với số rất lớn → mất precision
```

### ✅ Đúng cách
```typescript
// Good: dùng integer (cents/đồng) cho tiền
// Store và tính toán bằng số nguyên nhỏ nhất
const priceInCents = 1999; // 19.99 USD
const taxInCents = Math.round(priceInCents * 0.1); // 200 cents
const totalInCents = priceInCents + taxInCents; // 2199 cents = $21.99
// Chỉ convert sang float khi display: (2199 / 100).toFixed(2)

// Hoặc dùng Decimal library
import Decimal from 'decimal.js';
const price = new Decimal('19.99');
const tax = price.mul('0.1').toDecimalPlaces(2);
const total = price.add(tax);

// Good: validate business constraints
function createOrderValidator(dto: CreateOrderDto): void {
  if (dto.quantity <= 0) {
    throw new ValidationError('Quantity must be positive');
  }
  if (dto.quantity > 10_000) {
    throw new ValidationError('Quantity exceeds maximum (10,000)');
  }
  if (dto.discountPercent < 0 || dto.discountPercent > 100) {
    throw new ValidationError('Discount must be between 0 and 100');
  }
}
```

**Câu hỏi review Numeric:**
- [ ] Có dùng floating point cho tiền/tài chính không? (nên dùng integer cents hoặc Decimal)
- [ ] Số lượng, giá tiền có validate positive/non-zero không?
- [ ] Có overflow potential với large number arithmetic không?
- [ ] Division có kiểm tra chia cho 0 không?

---

## 4. String & Encoding Edge Cases

```typescript
// ❌ Không handle encoding issues
function slugify(title: string): string {
  return title.toLowerCase().replace(/ /g, '-');
  // "Tên sản phẩm" → "tên-sản-phẩm" (ok?)
  // "Hello World!" → "hello-world!" (dấu ! vẫn còn)
  // "" → "" (empty slug)
  // null → crash
}

// ✅ Handle đầy đủ
function slugify(title: string): string {
  if (!title || typeof title !== 'string') {
    throw new ValidationError('Title must be a non-empty string');
  }
  
  const slug = title
    .normalize('NFD')                           // normalize unicode
    .replace(/[\u0300-\u036f]/g, '')           // remove diacritics
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')                  // remove special chars
    .replace(/[\s_-]+/g, '-')                  // spaces/underscores → hyphen
    .replace(/^-+|-+$/g, '');                  // trim leading/trailing hyphens
  
  if (!slug) {
    throw new ValidationError(`Cannot create slug from title: "${title}"`);
  }
  
  return slug;
}
```

**Câu hỏi review String:**
- [ ] Có handle empty string khác với null/undefined không?
- [ ] String length có được kiểm tra trước khi insert DB không?
- [ ] Unicode/emoji có được handle đúng không?
- [ ] Có trim() whitespace từ user input không?

---

## 5. Error Handling Patterns

### ❌ Anti-patterns
```typescript
// Bad: error bị nuốt
try {
  await riskyOperation();
} catch {} // ❌ silent failure

// Bad: throw primitive
throw 'Something went wrong'; // ❌ mất stack trace

// Bad: expose internal error ra client
res.status(500).json({ error: error.message }); // ❌ leak stack trace, DB schema

// Bad: không phân biệt loại lỗi
try {
  const user = await fetchUser(id);
  await sendEmail(user.email, content);
} catch (error) {
  // Không biết fetchUser fail hay sendEmail fail
  res.status(500).json({ error: 'Something failed' });
}
```

### ✅ Error handling tốt
```typescript
// Good: Custom error hierarchy
class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
    public readonly isOperational = true, // operational vs programmer error
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      id ? `${resource} with id "${id}" not found` : `${resource} not found`,
      'NOT_FOUND',
      404,
    );
  }
}

class ValidationError extends AppError {
  constructor(message: string, public readonly fields?: Record<string, string>) {
    super(message, 'VALIDATION_ERROR', 422);
  }
}

class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 'CONFLICT', 409);
  }
}

// Good: global error handler (NestJS)
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (error instanceof AppError && error.isOperational) {
      // Lỗi nghiệp vụ có thể show cho user
      return response.status(error.statusCode).json({
        error: {
          code: error.code,
          message: error.message,
          ...(error instanceof ValidationError && { fields: error.fields }),
          requestId: request.id,
        },
      });
    }

    // Programmer error / unexpected: log full details, hide from user
    logger.error('Unhandled error', { error, requestId: request.id });
    
    return response.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
        requestId: request.id, // user có thể dùng để report
      },
    });
  }
}
```

**Câu hỏi review Error Handling:**
- [ ] Có empty catch block không?
- [ ] Có throw primitive (string) thay vì Error object không?
- [ ] Internal error (stack trace, DB error) có bị expose ra client không?
- [ ] Có phân biệt operational error vs programmer error không?
- [ ] Error có đủ context để debug không (resource id, input, ...)

---

## 6. Idempotency & Duplicate Requests

```typescript
// ❌ Không handle duplicate requests
// Nếu client gửi request 2 lần (network retry), đơn hàng bị tạo 2 lần
@Post('/orders')
async createOrder(@Body() dto: CreateOrderDto) {
  return this.orderService.create(dto);
}

// ✅ Idempotent với idempotency key
@Post('/orders')
async createOrder(
  @Body() dto: CreateOrderDto,
  @Headers('x-idempotency-key') idempotencyKey: string,
) {
  if (!idempotencyKey) {
    throw new ValidationError('x-idempotency-key header is required');
  }
  
  // Check cache trước
  const cached = await cache.get(`idempotency:${idempotencyKey}`);
  if (cached) {
    return JSON.parse(cached); // trả lại kết quả cũ
  }
  
  const order = await this.orderService.create(dto);
  
  // Cache kết quả trong 24h
  await cache.set(
    `idempotency:${idempotencyKey}`,
    JSON.stringify(order),
    'EX', 86400,
  );
  
  return order;
}
```

**Câu hỏi review Idempotency:**
- [ ] Các mutation operation (create, pay, transfer) có idempotent không?
- [ ] Network retry có thể gây duplicate không?
- [ ] Có cơ chế deduplication (idempotency key, unique constraint) không?
