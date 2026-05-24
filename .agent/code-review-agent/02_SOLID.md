# 🏗️ Sub-Agent 02 — SOLID Principles Review

## Mục đích
Đánh giá code theo 5 nguyên tắc SOLID, đặc biệt quan trọng khi review các class, service, module lớn.

---

## S — Single Responsibility Principle (SRP)

> **"Một class/module chỉ nên có một lý do để thay đổi"**

### ❌ Vi phạm SRP
```typescript
// Bad: UserService làm quá nhiều thứ
class UserService {
  async getUser(id: string) { /* DB query */ }
  async updateUser(id: string, data: UpdateUserDto) { /* DB update */ }
  
  // ❌ Email không phải trách nhiệm của UserService
  async sendWelcomeEmail(user: User) {
    const template = `<html>...${user.name}...</html>`;
    await nodemailer.sendMail({ to: user.email, html: template });
  }
  
  // ❌ Analytics cũng không phải
  trackUserActivity(userId: string, action: string) {
    mixpanel.track(action, { userId, timestamp: Date.now() });
  }
  
  // ❌ Password hashing không phải
  async hashPassword(plain: string): Promise<string> {
    return bcrypt.hash(plain, 10);
  }
}
```

### ✅ Đúng SRP
```typescript
// Good: mỗi service một trách nhiệm
class UserRepository {
  async findById(id: string): Promise<User | null> { }
  async update(id: string, data: Partial<User>): Promise<User> { }
}

class EmailService {
  async sendWelcomeEmail(user: User): Promise<void> { }
  async sendPasswordResetEmail(user: User, token: string): Promise<void> { }
}

class AnalyticsService {
  track(event: string, properties: Record<string, unknown>): void { }
}

class PasswordService {
  async hash(plain: string): Promise<string> { }
  async verify(plain: string, hashed: string): Promise<boolean> { }
}

// UserService chỉ lo orchestrate
class UserService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly emailService: EmailService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  async registerUser(dto: RegisterUserDto): Promise<User> {
    const user = await this.userRepo.create(dto);
    await this.emailService.sendWelcomeEmail(user);
    this.analyticsService.track('user_registered', { userId: user.id });
    return user;
  }
}
```

**Câu hỏi review SRP:**
- [ ] Class/module có hơn 1 lý do để thay đổi không?
- [ ] Class có hơn 200-300 dòng không? (thường vi phạm SRP)
- [ ] Import list của file có quá nhiều domain khác nhau không?
- [ ] Có thể mô tả trách nhiệm của class trong 1 câu ngắn không?

---

## O — Open/Closed Principle (OCP)

> **"Mở để mở rộng, đóng để sửa đổi"**

### ❌ Vi phạm OCP
```typescript
// Bad: mỗi lần thêm payment method phải sửa hàm này
function processPayment(order: Order, method: string): PaymentResult {
  if (method === 'credit_card') {
    return stripe.charge(order.total, order.cardToken);
  } else if (method === 'paypal') {
    return paypal.createPayment(order.total);
  } else if (method === 'momo') {
    // thêm mới → phải sửa file này → risk break code cũ
    return momo.pay(order.total, order.phone);
  }
  throw new Error('Unsupported payment method');
}
```

### ✅ Đúng OCP
```typescript
// Good: thêm payment method mới không cần sửa code cũ
interface PaymentProcessor {
  process(order: Order): Promise<PaymentResult>;
}

class StripeProcessor implements PaymentProcessor {
  async process(order: Order): Promise<PaymentResult> {
    return stripe.charge(order.total, order.cardToken);
  }
}

class MomoProcessor implements PaymentProcessor {
  async process(order: Order): Promise<PaymentResult> {
    return momo.pay(order.total, order.phone);
  }
}

// Thêm VNPay → chỉ cần tạo class mới, không đụng code cũ
class VNPayProcessor implements PaymentProcessor {
  async process(order: Order): Promise<PaymentResult> { }
}

class PaymentService {
  private processors = new Map<string, PaymentProcessor>([
    ['stripe', new StripeProcessor()],
    ['momo', new MomoProcessor()],
    ['vnpay', new VNPayProcessor()],
  ]);

  async processPayment(order: Order, method: string): Promise<PaymentResult> {
    const processor = this.processors.get(method);
    if (!processor) throw new UnsupportedPaymentMethodError(method);
    return processor.process(order);
  }
}
```

**Câu hỏi review OCP:**
- [ ] Có đoạn `if/else` hoặc `switch` theo `type/kind` mà hay phải thêm case không?
- [ ] Khi thêm tính năng mới có phải sửa code hiện tại không?
- [ ] Có dùng interface/abstract class để định nghĩa contract không?

---

## L — Liskov Substitution Principle (LSP)

> **"Subclass phải có thể thay thế được cho parent class mà không làm vỡ logic"**

### ❌ Vi phạm LSP
```typescript
class Rectangle {
  constructor(protected width: number, protected height: number) {}
  
  setWidth(w: number) { this.width = w; }
  setHeight(h: number) { this.height = h; }
  getArea() { return this.width * this.height; }
}

// ❌ Square vi phạm LSP: khi set width thì height cũng thay đổi
// → hành vi khác với Rectangle → code dùng Rectangle bị break
class Square extends Rectangle {
  setWidth(w: number) {
    this.width = w;
    this.height = w; // Side effect khác với parent!
  }
  setHeight(h: number) {
    this.width = h;
    this.height = h; // Side effect khác với parent!
  }
}

// Code này hoạt động đúng với Rectangle nhưng sai với Square
function doubleWidth(shape: Rectangle) {
  const originalHeight = shape.height;
  shape.setWidth(shape.width * 2);
  // Với Square: height cũng thay đổi → assertion sai!
  console.assert(shape.height === originalHeight); // ❌ FAIL
}
```

### ✅ Đúng LSP
```typescript
// Good: dùng composition thay inheritance khi hành vi khác nhau
interface Shape {
  getArea(): number;
}

class Rectangle implements Shape {
  constructor(private width: number, private height: number) {}
  getArea() { return this.width * this.height; }
}

class Square implements Shape {
  constructor(private side: number) {}
  getArea() { return this.side * this.side; }
}
```

**Câu hỏi review LSP:**
- [ ] Subclass có override method theo cách làm thay đổi kỳ vọng behavior không?
- [ ] Subclass có throw exception mà parent không throw không?
- [ ] Có chỗ nào cần `instanceof` để xử lý khác nhau theo subtype không? (dấu hiệu vi phạm LSP)

---

## I — Interface Segregation Principle (ISP)

> **"Không nên ép class implement interface với method mà nó không dùng"**

### ❌ Vi phạm ISP
```typescript
// Bad: interface quá fat
interface UserManager {
  getUser(id: string): User;
  updateUser(id: string, data: Partial<User>): User;
  deleteUser(id: string): void;
  sendEmail(userId: string, content: string): void;
  generateReport(userId: string): UserReport;
  exportToCsv(users: User[]): string;
  sendSmsNotification(userId: string, message: string): void;
}

// Class này chỉ cần đọc User nhưng phải implement tất cả!
class UserReadOnlyService implements UserManager {
  getUser(id: string) { /* ok */ }
  updateUser() { throw new Error('Not supported!'); } // ❌
  deleteUser() { throw new Error('Not supported!'); } // ❌
  sendEmail() { throw new Error('Not supported!'); }  // ❌
  // ... tương tự cho phần còn lại
}
```

### ✅ Đúng ISP
```typescript
// Good: tách interface nhỏ theo nhóm trách nhiệm
interface UserReader {
  findById(id: string): Promise<User | null>;
  findAll(filters?: UserFilters): Promise<User[]>;
}

interface UserWriter {
  create(data: CreateUserDto): Promise<User>;
  update(id: string, data: UpdateUserDto): Promise<User>;
  delete(id: string): Promise<void>;
}

interface UserNotifier {
  sendEmail(userId: string, content: EmailContent): Promise<void>;
  sendSms(userId: string, message: string): Promise<void>;
}

// Class chỉ implement những gì nó cần
class UserReadOnlyService implements UserReader {
  findById(id: string) { }
  findAll(filters?: UserFilters) { }
}

class UserAdminService implements UserReader, UserWriter {
  // implement cả 2
}
```

**Câu hỏi review ISP:**
- [ ] Có method nào trong interface bị implement bằng `throw new Error('Not implemented')` không?
- [ ] Interface có bị gọi là "God Interface" (quá nhiều method không liên quan)?
- [ ] Có thể tách interface lớn thành nhiều interface nhỏ hơn không?

---

## D — Dependency Inversion Principle (DIP)

> **"Module cấp cao không nên phụ thuộc vào module cấp thấp. Cả hai nên phụ thuộc vào abstraction."**

### ❌ Vi phạm DIP
```typescript
// Bad: OrderService phụ thuộc trực tiếp vào implementation cụ thể
import { MySQLDatabase } from './mysql-database';
import { EmailJsService } from './emailjs-service';

class OrderService {
  private db = new MySQLDatabase(); // ❌ hard-coded dependency
  private email = new EmailJsService(); // ❌ hard-coded dependency

  async createOrder(data: CreateOrderDto) {
    const order = await this.db.query('INSERT INTO orders ...'); // ❌
    await this.email.send(data.userEmail, 'Order created'); // ❌
    return order;
  }
}
// → Không thể test (cần mock DB thật)
// → Muốn đổi sang PostgreSQL phải sửa OrderService
```

### ✅ Đúng DIP
```typescript
// Good: phụ thuộc vào abstraction
interface OrderRepository {
  create(data: CreateOrderDto): Promise<Order>;
  findById(id: string): Promise<Order | null>;
}

interface NotificationService {
  send(recipient: string, content: NotificationContent): Promise<void>;
}

class OrderService {
  constructor(
    private readonly orderRepo: OrderRepository,      // abstraction
    private readonly notifier: NotificationService,    // abstraction
  ) {}

  async createOrder(data: CreateOrderDto): Promise<Order> {
    const order = await this.orderRepo.create(data);  // không biết DB gì
    await this.notifier.send(data.userEmail, { ... }); // không biết email provider nào
    return order;
  }
}

// Dễ dàng swap implementation
const service = new OrderService(
  new PostgresOrderRepository(), // hoặc MongoOrderRepository
  new SendGridNotificationService(), // hoặc SESNotificationService
);

// Dễ dàng test với mock
const service = new OrderService(
  new MockOrderRepository(),
  new MockNotificationService(),
);
```

**Câu hỏi review DIP:**
- [ ] Có `new ConcreteClass()` bên trong business logic không?
- [ ] Dependencies có được inject vào (constructor/prop injection) không?
- [ ] Có thể swap implementation mà không sửa business logic không?
- [ ] Business logic có import trực tiếp từ infrastructure layer (DB, HTTP, file system) không?
