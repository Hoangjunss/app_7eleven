# 🔒 Sub-Agent 06 — Security Review

## Mục đích
Phát hiện các lỗ hổng bảo mật phổ biến theo OWASP Top 10 và các security best practices cho web application.

---

## 1. Authentication & Authorization

### ❌ Dấu hiệu BAD
```typescript
// Bad: không kiểm tra authorization (chỉ authentication)
@Get('/orders/:id')
@UseGuards(JwtAuthGuard) // chỉ check đăng nhập, không check quyền sở hữu
async getOrder(@Param('id') orderId: string) {
  return this.orderService.findById(orderId);
  // ❌ User A có thể xem order của User B chỉ cần biết orderId!
}

// Bad: JWT secret yếu hoặc hardcoded
const token = jwt.sign(payload, 'secret'); // ❌ hardcoded, yếu
const token = jwt.sign(payload, 'mysecretkey123'); // ❌

// Bad: không validate JWT algorithm
jwt.verify(token, secret); // ❌ có thể bị alg:none attack

// Bad: password reset token không có expiry
const resetToken = crypto.randomBytes(32).toString('hex');
await user.update({ resetToken }); // ❌ token tồn tại mãi mãi
```

### ✅ Secure Auth
```typescript
// Good: kiểm tra BOTH authentication + authorization
@Get('/orders/:id')
@UseGuards(JwtAuthGuard)
async getOrder(
  @Param('id') orderId: string,
  @CurrentUser() currentUser: AuthUser,
) {
  const order = await this.orderService.findById(orderId);
  
  if (!order) throw new NotFoundException();
  
  // Authorization check: chỉ owner hoặc admin được xem
  if (order.userId !== currentUser.id && !currentUser.isAdmin) {
    throw new ForbiddenException('You do not have permission to view this order');
  }
  
  return order;
}

// Good: JWT config an toàn
const token = jwt.sign(payload, process.env.JWT_SECRET!, {
  algorithm: 'HS256',     // specify algorithm explicitly
  expiresIn: '15m',       // access token ngắn hạn
  issuer: 'myapp.com',
  audience: 'myapp-users',
});

// Verify cũng phải specify algorithm (chống alg:none attack)
jwt.verify(token, process.env.JWT_SECRET!, {
  algorithms: ['HS256'], // whitelist algorithms
});

// Good: password reset token có expiry
const resetToken = crypto.randomBytes(32).toString('hex');
const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 giờ

await user.update({
  resetToken: await hashToken(resetToken), // hash token trước khi store
  resetTokenExpiry,
});
```

**Câu hỏi review Auth:**
- [ ] Các endpoint có kiểm tra AUTHORIZATION (quyền) không, không chỉ authentication (đăng nhập)?
- [ ] JWT secret có lấy từ env variable không?
- [ ] JWT có ngắn hạn (access token 15-60 phút) không?
- [ ] Token trong DB có được hash không?
- [ ] Sensitive endpoint có rate limiting không?

---

## 2. Injection Attacks

### SQL Injection
```typescript
// ❌ CRITICAL: SQL injection
const users = await db.query(
  `SELECT * FROM users WHERE email = '${email}'`
);
// Input: email = "' OR '1'='1" → dump toàn bộ users
// Input: email = "'; DROP TABLE users; --" → xoá bảng

// ✅ Parameterized query
const users = await db.query(
  'SELECT * FROM users WHERE email = $1',
  [email]
);

// ✅ ORM (Sequelize/Prisma tự handle)
const user = await User.findOne({ where: { email } });
```

### XSS (Cross-Site Scripting)
```typescript
// ❌ Render unsanitized HTML
function renderUserComment(comment: string): string {
  return `<div class="comment">${comment}</div>`;
  // Input: <script>document.cookie // steal cookies</script>
}

// ✅ Escape HTML
import { escape } from 'html-escaper';

function renderUserComment(comment: string): string {
  return `<div class="comment">${escape(comment)}</div>`;
}

// ✅ React tự escape, nhưng cẩn thận dangerouslySetInnerHTML
// ❌ Không làm thế này:
<div dangerouslySetInnerHTML={{ __html: userContent }} />

// ✅ Nếu bắt buộc dùng HTML, sanitize trước:
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userContent) }} />
```

### Path Traversal
```typescript
// ❌ Path traversal
app.get('/files/:filename', (req, res) => {
  const filePath = path.join(__dirname, 'uploads', req.params.filename);
  res.sendFile(filePath);
  // filename = "../../etc/passwd" → đọc được system files!
});

// ✅ Validate path
app.get('/files/:filename', (req, res) => {
  const filename = path.basename(req.params.filename); // loại bỏ path components
  const filePath = path.join(__dirname, 'uploads', filename);
  
  // Double check path vẫn trong thư mục cho phép
  if (!filePath.startsWith(path.join(__dirname, 'uploads'))) {
    return res.status(403).send('Forbidden');
  }
  
  res.sendFile(filePath);
});
```

**Câu hỏi review Injection:**
- [ ] Có raw SQL string interpolation không?
- [ ] User input có được escape/sanitize trước khi render HTML không?
- [ ] File path có được validate không?
- [ ] `eval()`, `Function()`, `setTimeout(string)` có được dùng với user input không?

---

## 3. Sensitive Data Exposure

### ❌ Dấu hiệu BAD
```typescript
// Bad: trả về sensitive data trong API response
async getUser(id: string) {
  return User.findByPk(id); // ❌ trả về toàn bộ user kể cả password hash
}

// Bad: log sensitive data
logger.info('User login attempt', { email, password }); // ❌

// Bad: sensitive data trong URL (sẽ bị log, cache, browser history)
GET /api/users?token=abc123&password=secret // ❌

// Bad: hardcoded credentials
const db = new Database({
  host: 'prod-db.company.com',
  password: 'P@ssw0rd123!', // ❌
});
```

### ✅ Data Protection
```typescript
// Good: DTO whitelist - chỉ expose field cần thiết
class UserResponseDto {
  @Expose() id: string;
  @Expose() email: string;
  @Expose() displayName: string;
  @Expose() createdAt: Date;
  // password, passwordHash, resetToken... KHÔNG có @Expose()
}

async getUser(id: string): Promise<UserResponseDto> {
  const user = await User.findByPk(id);
  return plainToInstance(UserResponseDto, user, { excludeExtraneousValues: true });
}

// Good: credential từ environment variable
const db = new Database({
  host: process.env.DB_HOST,
  password: process.env.DB_PASSWORD,
});

// Good: mask sensitive data trong logs
logger.info('Payment processed', {
  orderId,
  userId,
  amount,
  cardLast4: card.number.slice(-4), // chỉ log 4 số cuối
  // cardNumber: card.number → KHÔNG BAO GIỜ LOG
});
```

**Câu hỏi review Data Exposure:**
- [ ] API response có trả về field không cần thiết (password hash, internal ID, ...)?
- [ ] Log có chứa PII (Personal Identifiable Information) hoặc secrets không?
- [ ] Có hardcoded credentials, API key, secret không?
- [ ] Sensitive data (password, token) trong URL không?
- [ ] Response header có leak thông tin server (X-Powered-By: Express) không?

---

## 4. CSRF & CORS

```typescript
// ❌ CORS quá rộng
app.use(cors()); // ❌ allow all origins
app.use(cors({ origin: '*' })); // ❌

// ✅ CORS cấu hình đúng
const allowedOrigins = [
  'https://myapp.com',
  'https://www.myapp.com',
  process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : null,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Idempotency-Key'],
}));

// CSRF protection cho cookie-based auth
import csrf from 'csurf';
app.use(csrf({ cookie: true }));
```

---

## 5. Rate Limiting & DoS Protection

```typescript
// ❌ Không có rate limiting
@Post('/auth/login')
async login(@Body() dto: LoginDto) {
  return this.authService.login(dto);
  // ❌ brute force attack: thử hàng triệu mật khẩu
}

// ✅ Rate limiting theo endpoint
import rateLimit from 'express-rate-limit';

// Strict limit cho auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 10, // 10 attempts per 15 minutes
  message: { error: { code: 'RATE_LIMIT', message: 'Too many attempts' } },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip + ':' + req.body?.email, // per IP + per email
});

app.post('/auth/login', authLimiter, loginHandler);

// Progressive delay sau nhiều lần thất bại
async function handleFailedLogin(email: string) {
  await incrementFailedAttempts(email);
  const attempts = await getFailedAttempts(email);
  
  if (attempts >= 10) {
    await lockAccount(email, '30m');
    throw new AccountLockedError();
  }
  
  if (attempts >= 5) {
    await sleep(Math.min(1000 * Math.pow(2, attempts - 5), 30000));
  }
  
  throw new InvalidCredentialsError();
}
```

**Câu hỏi review Rate Limiting:**
- [ ] Auth endpoints (login, register, forgot password) có rate limiting không?
- [ ] Public API có rate limiting chống DoS không?
- [ ] File upload có giới hạn size không?
- [ ] Có account lockout sau nhiều lần đăng nhập sai không?

---

## 6. Security Headers

```typescript
// ✅ Helmet.js cho Express/NestJS
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://trusted-cdn.com'],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https://api.myapp.com'],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 năm
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true,          // X-Content-Type-Options: nosniff
  frameguard: { action: 'deny' }, // X-Frame-Options: DENY
  xssFilter: true,
}));
```

**Câu hỏi review Security Headers:**
- [ ] Có dùng Helmet hoặc equivalent security headers không?
- [ ] Content-Security-Policy có được config không?
- [ ] HSTS có được enable cho HTTPS không?
- [ ] Cookie có `Secure`, `HttpOnly`, `SameSite` attributes không?
