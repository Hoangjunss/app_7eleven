# 💼 Sub-Agent 10 — Business Logic & Domain Review

## Mục đích
Review xem code có phản ánh đúng nghiệp vụ không, domain model có rõ ràng không, và business rules có được enforce đúng chỗ không.

---

## 1. Domain Model Clarity

### ❌ Anemic Domain Model
```typescript
// Bad: model chỉ là data bag, không có behavior
class Order {
  id: string;
  status: string; // ❌ string thay vì enum
  items: any[];   // ❌ any
  total: number;
  // Không có method nào!
}

// Business logic bị leak ra service
class OrderService {
  canCancel(order: Order): boolean {
    return order.status === 'pending' && // magic string
      new Date().getTime() - order.createdAt.getTime() < 30 * 60 * 1000;
  }
  
  calculateTotal(order: Order): number {
    return order.items.reduce((sum, item) => sum + item.price * item.qty, 0);
  }
}
// → Logic bị phân tán, khó maintain, dễ nhất quán
```

### ✅ Rich Domain Model
```typescript
// Good: model chứa behavior và enforce invariants
type OrderStatus = 'draft' | 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

class Order {
  private constructor(
    public readonly id: string,
    private _status: OrderStatus,
    private _items: OrderItem[],
    public readonly createdAt: Date,
    public readonly userId: string,
  ) {}

  static create(userId: string, items: OrderItem[]): Order {
    if (items.length === 0) {
      throw new DomainError('Order must have at least one item');
    }
    return new Order(generateId(), 'draft', items, new Date(), userId);
  }

  get status(): OrderStatus { return this._status; }
  get items(): ReadonlyArray<OrderItem> { return this._items; }
  
  get total(): Money {
    return this._items.reduce(
      (sum, item) => sum.add(item.subtotal),
      Money.zero('VND')
    );
  }

  canCancel(): boolean {
    const CANCELLATION_WINDOW_MS = 30 * 60 * 1000;
    return (
      this._status === 'pending' &&
      Date.now() - this.createdAt.getTime() < CANCELLATION_WINDOW_MS
    );
  }

  cancel(reason: string): void {
    if (!this.canCancel()) {
      throw new DomainError(
        `Order cannot be cancelled: status is ${this._status} or cancellation window has passed`
      );
    }
    this._status = 'cancelled';
    this.addEvent(new OrderCancelledEvent(this.id, reason));
  }

  confirm(): void {
    if (this._status !== 'draft' && this._status !== 'pending') {
      throw new DomainError(`Cannot confirm order with status: ${this._status}`);
    }
    this._status = 'confirmed';
  }
}
```

**Câu hỏi review Domain Model:**
- [ ] Business rules có được đặt trong domain model hay bị leak ra service?
- [ ] Model có enforce invariants (đảm bảo object luôn ở trạng thái hợp lệ) không?
- [ ] Domain events có được model không?
- [ ] Ubiquitous language (ngôn ngữ nghiệp vụ) có được dùng nhất quán trong code không?

---

## 2. Business Rule Enforcement

```typescript
// ❌ Business rules không được centralize
// Rule: "Chỉ admin mới được hoàn tiền hơn 1 triệu"

// Rule bị duplicate ở nhiều nơi
// In OrderController:
if (amount > 1_000_000 && !currentUser.isAdmin) throw new ForbiddenError();

// In RefundService:
if (refundAmount > 1_000_000 && !user.isAdmin) throw new Error('...');

// In BatchRefundJob:
if (order.refundAmount > 1000000 && !operator.admin) continue; // khác format!

// ❌ Rule bị implement khác nhau mỗi chỗ → nhất quán, dễ bug

// ✅ Centralize business rule
class RefundPolicy {
  static readonly LARGE_REFUND_THRESHOLD = Money.of(1_000_000, 'VND');
  
  static canProcessRefund(amount: Money, operator: User): RefundPermission {
    if (amount.greaterThan(this.LARGE_REFUND_THRESHOLD) && !operator.hasRole('admin')) {
      return RefundPermission.denied(
        `Refunds over ${this.LARGE_REFUND_THRESHOLD.format()} require admin approval`
      );
    }
    return RefundPermission.allowed();
  }
}

// Dùng ở mọi nơi
const permission = RefundPolicy.canProcessRefund(refundAmount, currentUser);
if (!permission.isAllowed) {
  throw new ForbiddenError(permission.reason);
}
```

---

## 3. State Machine & Workflow

```typescript
// ❌ State transition không được control, có thể đi sang trạng thái không hợp lệ
async function updateOrderStatus(orderId: string, newStatus: string) {
  await Order.update({ status: newStatus }, { where: { id: orderId } });
  // Có thể set từ 'delivered' → 'pending' (vô lý!)
  // Không validate transition hợp lệ
}

// ✅ State machine rõ ràng
const ORDER_STATE_MACHINE: Record<OrderStatus, OrderStatus[]> = {
  draft: ['pending', 'cancelled'],
  pending: ['confirmed', 'cancelled'],
  confirmed: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [], // terminal state
  cancelled: [], // terminal state
};

function validateTransition(from: OrderStatus, to: OrderStatus): void {
  const allowedTransitions = ORDER_STATE_MACHINE[from];
  if (!allowedTransitions.includes(to)) {
    throw new InvalidStateTransitionError(
      `Cannot transition order from '${from}' to '${to}'. ` +
      `Allowed transitions: ${allowedTransitions.join(', ') || 'none (terminal state)'}`
    );
  }
}

async function updateOrderStatus(orderId: string, newStatus: OrderStatus) {
  const order = await orderRepo.findById(orderId);
  if (!order) throw new NotFoundError('Order', orderId);
  
  validateTransition(order.status, newStatus); // validate trước khi update
  
  return orderRepo.update(orderId, { status: newStatus });
}
```

---

## 4. Money & Financial Calculations

```typescript
// ❌ Dùng number cho tiền → precision errors, không rõ currency
function applyDiscount(price: number, discountPercent: number): number {
  return price * (1 - discountPercent / 100);
  // 199.99 * 0.9 = 179.99100000000001 ❌
}

// ✅ Money Value Object
class Money {
  private constructor(
    private readonly amountInCents: number, // store as integer
    public readonly currency: Currency,
  ) {}

  static of(amount: number, currency: Currency): Money {
    if (!Number.isFinite(amount)) throw new Error('Invalid amount');
    if (amount < 0) throw new Error('Amount cannot be negative');
    return new Money(Math.round(amount * 100), currency);
  }

  static zero(currency: Currency): Money {
    return new Money(0, currency);
  }

  add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.amountInCents + other.amountInCents, this.currency);
  }

  applyDiscount(percent: number): Money {
    if (percent < 0 || percent > 100) throw new Error('Discount must be 0-100');
    const discountAmount = Math.round(this.amountInCents * percent / 100);
    return new Money(this.amountInCents - discountAmount, this.currency);
  }

  greaterThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.amountInCents > other.amountInCents;
  }

  format(): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: this.currency,
    }).format(this.amountInCents / 100);
  }

  toJSON() {
    return { amount: this.amountInCents / 100, currency: this.currency };
  }

  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new Error(`Currency mismatch: ${this.currency} vs ${other.currency}`);
    }
  }
}
```

---

## 5. Temporal Logic

```typescript
// ❌ Timezone vấn đề trong multi-timezone app
function isBusinessDay(date: Date): boolean {
  const day = date.getDay(); // ❌ dùng local timezone của server
  return day !== 0 && day !== 6;
}

// ❌ So sánh date không đúng
const isExpired = token.expiresAt < new Date(); // có thể bị timezone issue

// ✅ Explicit timezone handling
import { DateTime } from 'luxon';

function isBusinessDay(date: Date, timezone: string = 'Asia/Ho_Chi_Minh'): boolean {
  const localDate = DateTime.fromJSDate(date).setZone(timezone);
  return localDate.weekday >= 1 && localDate.weekday <= 5; // Mon-Fri
}

// ✅ Store timestamps as UTC, display in user's timezone
class TokenExpiry {
  static isExpired(expiresAtUtc: Date): boolean {
    return Date.now() > expiresAtUtc.getTime();
  }
  
  static willExpireSoon(expiresAtUtc: Date, withinMs = 5 * 60 * 1000): boolean {
    return Date.now() > expiresAtUtc.getTime() - withinMs;
  }
}
```

---

## 6. Audit Trail & Data Integrity

```typescript
// ❌ Không có audit trail cho data quan trọng
async function updatePrice(productId: string, newPrice: number) {
  await Product.update({ price: newPrice }, { where: { id: productId } });
  // Ai thay đổi? Khi nào? Giá cũ là bao nhiêu? → không biết
}

// ✅ Audit log cho financial/critical data
async function updatePrice(
  productId: string,
  newPrice: Money,
  operator: User,
  reason: string,
): Promise<Product> {
  return db.transaction(async (t) => {
    const product = await Product.findByPk(productId, { transaction: t });
    if (!product) throw new NotFoundError('Product', productId);
    
    const oldPrice = product.price;
    
    await product.update({ price: newPrice.toJSON() }, { transaction: t });
    
    // Audit log
    await PriceChangeLog.create({
      productId,
      oldPrice: oldPrice,
      newPrice: newPrice.toJSON(),
      changedBy: operator.id,
      reason,
      changedAt: new Date(),
      ipAddress: operator.lastIpAddress,
    }, { transaction: t });
    
    return product;
  });
}
```

**Câu hỏi review Business Logic:**
- [ ] Business rules có được centralize không, hay bị duplicate ở nhiều nơi?
- [ ] State transitions có được validate không?
- [ ] Money/tài chính có được tính đúng (không dùng float) không?
- [ ] Timezone có được handle đúng không?
- [ ] Data quan trọng (giá, quyền, role) có audit trail không?
- [ ] Domain error messages có đủ thông tin để debug không?
