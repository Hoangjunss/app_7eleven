# 🧹 Sub-Agent 01 — Clean Code Review

## Mục đích
Đánh giá chất lượng code theo các nguyên tắc Clean Code của Robert C. Martin và các best practices hiện đại.

---

## Checklist Review

### 1. Đặt tên (Naming)

#### ❌ Dấu hiệu BAD
```typescript
// Bad: tên quá ngắn, không có nghĩa
const d = new Date();
const u = users.filter(x => x.a === 1);
function proc(data: any) {}

// Bad: tên gây nhầm lẫn
const isUser = getUserList(); // trả về array nhưng tên là boolean?
const userData = true; // tên là Data nhưng là boolean?

// Bad: magic number/string
if (status === 3) { }
setTimeout(fn, 86400000);

// Bad: Hungarian notation lỗi thời
const strName = "John";
const arrUsers = [];
const bIsActive = true;
```

#### ✅ Dấu hiệu GOOD
```typescript
// Tên rõ ràng, tự document được
const registrationDate = new Date();
const activeUsers = users.filter(user => user.isActive);

// Hàm tên là động từ, mô tả hành động
function fetchUserById(userId: string): Promise<User> {}
function calculateOrderTotal(items: OrderItem[]): number {}
function isValidEmail(email: string): boolean {}

// Constants có tên rõ nghĩa
const MILLISECONDS_PER_DAY = 86_400_000;
const MAX_RETRY_ATTEMPTS = 3;
const ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
} as const;
```

**Câu hỏi cần trả lời khi review:**
- [ ] Đọc tên biến/hàm có hiểu ngay không cần comment?
- [ ] Tên có phù hợp với kiểu dữ liệu (boolean bắt đầu bằng `is/has/can`, array là số nhiều)?
- [ ] Có magic number/string nào cần đặt constant không?
- [ ] Tên có nhất quán trong toàn codebase không?

---

### 2. Hàm (Functions)

#### ❌ Dấu hiệu BAD
```typescript
// Bad: hàm làm quá nhiều thứ (vi phạm Single Responsibility)
async function handleUserRegistration(formData: any) {
  // validate
  if (!formData.email || !formData.password) throw new Error('...');
  if (formData.password.length < 8) throw new Error('...');
  
  // hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(formData.password, salt);
  
  // save to DB
  const user = await db.users.create({ ...formData, password: hashedPassword });
  
  // send email
  await sendEmail(user.email, 'Welcome!', emailTemplate);
  
  // log analytics
  analytics.track('user_registered', { userId: user.id });
  
  return user;
}

// Bad: quá nhiều tham số
function createOrder(userId, productId, quantity, discount, couponCode, shippingAddress, paymentMethod, notes) {}

// Bad: side effects ngầm (hàm getX nhưng lại modify state)
function getActiveUsers() {
  lastFetchTime = Date.now(); // side effect ẩn!
  return users.filter(u => u.isActive);
}
```

#### ✅ Dấu hiệu GOOD
```typescript
// Good: mỗi hàm một trách nhiệm
async function registerUser(registrationData: RegistrationInput): Promise<User> {
  const validatedData = validateRegistrationInput(registrationData);
  const hashedPassword = await hashPassword(validatedData.password);
  const user = await createUserRecord({ ...validatedData, password: hashedPassword });
  
  // Side effects tường minh, dễ test riêng
  await Promise.all([
    sendWelcomeEmail(user),
    trackRegistrationEvent(user),
  ]);
  
  return user;
}

// Good: dùng object thay nhiều params
interface CreateOrderParams {
  userId: string;
  items: OrderItem[];
  discount?: DiscountCode;
  shipping: ShippingAddress;
  payment: PaymentMethod;
}
function createOrder(params: CreateOrderParams): Promise<Order> {}
```

**Câu hỏi cần trả lời khi review:**
- [ ] Hàm có làm nhiều hơn 1 việc không?
- [ ] Hàm có quá 3-4 tham số không? (nếu có → gom vào object)
- [ ] Hàm có side effect ẩn không?
- [ ] Hàm dài hơn 30-40 dòng không? (thường là dấu hiệu cần tách)

---

### 3. Comments & Documentation

#### ❌ Dấu hiệu BAD
```typescript
// Bad: comment giải thích WHAT (code đã nói rồi)
// tăng i lên 1
i++;

// Bad: comment thừa, outdated
// TODO: fix this (từ 2 năm trước, không ai fix)
// Đây là hàm xử lý user
function processUser() {}

// Bad: code bị comment out
// const oldFn = () => { ... }
```

#### ✅ Dấu hiệu GOOD
```typescript
// Good: comment giải thích WHY, không phải WHAT
// Dùng 10 rounds thay vì mặc định để cân bằng giữa security và performance
// Theo benchmark nội bộ: 10 rounds = ~100ms, chấp nhận được cho UX
const BCRYPT_SALT_ROUNDS = 10;

// Good: comment cho business logic phức tạp
// Theo quy định nghiệp vụ (BRD-2024-001):
// Đơn hàng chỉ được huỷ nếu chưa qua 30 phút kể từ lúc xác nhận
function canCancelOrder(order: Order): boolean {
  const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;
  return order.confirmedAt.getTime() > thirtyMinutesAgo;
}

// Good: JSDoc cho public API
/**
 * Tính phí vận chuyển dựa trên trọng lượng và vùng giao hàng
 * @param weightKg - Trọng lượng tính bằng kg
 * @param zone - Vùng giao hàng ('north' | 'central' | 'south')
 * @returns Phí vận chuyển tính bằng VND
 * @throws {InvalidZoneError} Nếu zone không hợp lệ
 */
function calculateShippingFee(weightKg: number, zone: ShippingZone): number {}
```

**Câu hỏi cần trả lời khi review:**
- [ ] Comment có giải thích WHY hay chỉ giải thích WHAT?
- [ ] Có code bị comment out không?
- [ ] Public API/hàm phức tạp có JSDoc không?
- [ ] Comment có bị outdated, sai với code hiện tại không?

---

### 4. Code Structure & Formatting

#### ❌ Dấu hiệu BAD
```typescript
// Bad: nested quá sâu (Pyramid of Doom)
function processOrder(order) {
  if (order) {
    if (order.user) {
      if (order.user.isActive) {
        if (order.items.length > 0) {
          // logic ở đây
        }
      }
    }
  }
}

// Bad: điều kiện phức tạp, khó đọc
if (user.age >= 18 && user.isVerified && !user.isBanned && user.subscription !== 'free' && user.lastLoginAt > thirtyDaysAgo) {}
```

#### ✅ Dấu hiệu GOOD
```typescript
// Good: Early return / Guard clauses
function processOrder(order: Order | null): void {
  if (!order) return;
  if (!order.user) return;
  if (!order.user.isActive) throw new InactiveUserError();
  if (order.items.length === 0) throw new EmptyOrderError();
  
  // logic chính ở đây, không bị nested
}

// Good: tách điều kiện phức tạp ra named variable
const isPremiumActiveUser = 
  user.age >= 18 &&
  user.isVerified &&
  !user.isBanned &&
  user.subscription !== 'free' &&
  user.lastLoginAt > thirtyDaysAgo;

if (isPremiumActiveUser) { }
```

**Câu hỏi cần trả lời khi review:**
- [ ] Có đoạn nào nested quá 3 cấp không?
- [ ] Có thể dùng early return để giảm nesting không?
- [ ] Điều kiện phức tạp có được đặt tên không?
- [ ] DRY — có đoạn code lặp lại không?

---

### 5. Xử lý Null/Undefined

#### ❌ Dấu hiệu BAD
```typescript
// Bad: không kiểm tra null
const userName = user.profile.name; // crash nếu profile là null

// Bad: dùng any che giấu vấn đề
function processData(data: any) {}

// Bad: assertion không có lý do
const element = document.getElementById('app')!; // unsafe
```

#### ✅ Dấu hiệu GOOD
```typescript
// Good: optional chaining + nullish coalescing
const userName = user?.profile?.name ?? 'Anonymous';

// Good: type guard rõ ràng
function isUser(value: unknown): value is User {
  return typeof value === 'object' && value !== null && 'id' in value;
}

// Good: assertion có kiểm tra + error message
const element = document.getElementById('app');
if (!element) {
  throw new Error('Root element #app không tồn tại trong DOM');
}
```

**Câu hỏi cần trả lời khi review:**
- [ ] Có truy cập property của object mà không kiểm tra null không?
- [ ] Có dùng `any` mà không có lý do chính đáng không?
- [ ] Có dùng `!` (non-null assertion) không an toàn không?
