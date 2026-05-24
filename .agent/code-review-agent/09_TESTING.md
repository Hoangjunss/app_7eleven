# 🧪 Sub-Agent 09 — Testing Review

## Mục đích
Đánh giá chất lượng test: coverage đúng chỗ, test có ý nghĩa, và testability của code.

---

## 1. Test Structure & Naming

### ❌ Dấu hiệu BAD
```typescript
// Bad: test name không mô tả được behavior
test('user test', () => { ... });
test('order function', () => { ... });
test('test 1', () => { ... });

// Bad: test nhiều thứ trong 1 test
test('user service', () => {
  // test create, update, delete, validate tất cả trong 1 test
  // Nếu fail không biết cái gì sai
});
```

### ✅ Good Test Structure
```typescript
// Good: Arrange-Act-Assert + descriptive names
describe('OrderService', () => {
  describe('createOrder', () => {
    it('should create order successfully when all inputs are valid', async () => {
      // Arrange
      const userId = 'user-123';
      const items = [{ productId: 'prod-1', quantity: 2 }];
      mockUserRepo.findById.mockResolvedValue(createMockUser({ id: userId }));
      mockProductRepo.findByIds.mockResolvedValue([createMockProduct()]);

      // Act
      const order = await orderService.createOrder(userId, { items });

      // Assert
      expect(order.userId).toBe(userId);
      expect(order.status).toBe('pending');
      expect(order.items).toHaveLength(1);
    });

    it('should throw NotFoundError when user does not exist', async () => {
      // Arrange
      mockUserRepo.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        orderService.createOrder('non-existent-user', { items: [] })
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw InsufficientStockError when product quantity is not enough', async () => {
      // test case rõ ràng
    });
  });
});
```

**Câu hỏi review Test Structure:**
- [ ] Test name có mô tả behavior cụ thể không?
- [ ] Mỗi test có test 1 thing không?
- [ ] Có dùng Arrange-Act-Assert pattern không?
- [ ] Test có setup/teardown clean không?

---

## 2. Unit Tests — Điều gì cần test

### Test hành vi, không test implementation
```typescript
// ❌ Test implementation detail (brittle test)
it('should call userRepo.findById once', async () => {
  await userService.getUser('123');
  expect(mockUserRepo.findById).toHaveBeenCalledTimes(1); // fragile!
  // Nếu refactor gọi 2 lần → test fail dù behavior đúng
});

// ✅ Test behavior/outcome
it('should return user when found', async () => {
  const expectedUser = createMockUser({ id: '123' });
  mockUserRepo.findById.mockResolvedValue(expectedUser);
  
  const result = await userService.getUser('123');
  
  expect(result).toEqual(expectedUser); // test output, không care cách implement
});
```

### Test edge cases
```typescript
describe('calculateDiscount', () => {
  // Happy path
  it('should apply 10% discount for premium users', () => {
    expect(calculateDiscount(100, 'premium')).toBe(90);
  });
  
  // Edge cases - đây mới là phần quan trọng
  it('should return original price when discount is 0', () => {
    expect(calculateDiscount(100, 'free')).toBe(100);
  });
  
  it('should not return negative price', () => {
    // Discount 150% không nên trả về -50
    expect(calculateDiscount(100, 'super-special')).toBeGreaterThanOrEqual(0);
  });
  
  it('should handle price of 0', () => {
    expect(calculateDiscount(0, 'premium')).toBe(0);
  });
  
  it('should throw ValidationError for negative price', () => {
    expect(() => calculateDiscount(-100, 'premium')).toThrow(ValidationError);
  });
  
  // Boundary values
  it('should handle maximum discount (100%)', () => {
    expect(calculateDiscount(100, 'staff')).toBe(0); // free for staff?
  });
});
```

---

## 3. Mocking Best Practices

```typescript
// ❌ Mock quá nhiều → test không có giá trị
it('should process order', async () => {
  mockValidate.mockReturnValue(true);
  mockCalculateTotal.mockReturnValue(100);
  mockSave.mockResolvedValue(order);
  mockSendEmail.mockResolvedValue(undefined);
  mockTrackEvent.mockReturnValue(undefined);
  
  const result = await processOrder(dto);
  
  // Test chỉ verify mock calls, không verify actual logic
  expect(mockValidate).toHaveBeenCalled();
  expect(mockSave).toHaveBeenCalled();
  // Giá trị gì? Logic gì? Test không nói lên điều gì
});

// ✅ Mock external dependencies, test real logic
it('should calculate correct total with discount', async () => {
  // Mock: external dependencies (DB, email, ...)
  const mockRepo = {
    save: jest.fn().mockImplementation((order) => ({ ...order, id: 'new-id' })),
  };
  
  // Real: business logic (calculateTotal, applyDiscount)
  const service = new OrderService(mockRepo, mockEmailService);
  
  const result = await service.createOrder({
    items: [
      { productId: 'p1', price: 100_000, quantity: 2 },
      { productId: 'p2', price: 50_000, quantity: 1 },
    ],
    discountPercent: 10,
  });
  
  // Assert actual computed values
  expect(result.subtotal).toBe(250_000);
  expect(result.discountAmount).toBe(25_000);
  expect(result.total).toBe(225_000);
});
```

**Câu hỏi review Mocking:**
- [ ] Chỉ mock external dependencies (DB, HTTP, file system) không mock internal logic?
- [ ] Mock có realistic không hay mock trả về giá trị "perfect" không thực tế?
- [ ] Có test với mock trả về lỗi/null không?

---

## 4. Integration Tests

```typescript
// Good: integration test với test DB thực
describe('OrderRepository (integration)', () => {
  let db: Sequelize;

  beforeAll(async () => {
    db = new Sequelize({ dialect: 'sqlite', storage: ':memory:' });
    await db.sync({ force: true });
  });

  afterAll(async () => {
    await db.close();
  });

  afterEach(async () => {
    await Order.truncate(); // clean up sau mỗi test
  });

  it('should create and retrieve order', async () => {
    const repo = new OrderRepository(db);
    
    const created = await repo.create({
      userId: 'user-1',
      total: 100_000,
      status: 'pending',
    });
    
    const found = await repo.findById(created.id);
    
    expect(found).not.toBeNull();
    expect(found!.total).toBe(100_000);
    expect(found!.status).toBe('pending');
  });
  
  it('should return null for non-existent order', async () => {
    const repo = new OrderRepository(db);
    const found = await repo.findById('non-existent-id');
    expect(found).toBeNull();
  });
});
```

---

## 5. Test Coverage — Quality over Quantity

```typescript
// ❌ Test chỉ để tăng coverage số, không có giá trị
it('should exist', () => {
  expect(new UserService()).toBeDefined(); // useless test
});

it('should return something', async () => {
  const result = await service.doSomething();
  expect(result).toBeTruthy(); // quá vague, không verify gì
});

// ✅ Focus coverage vào business critical paths
// Phân loại theo mức độ critical:

// MUST HAVE test coverage:
// - Payment processing logic
// - Authorization/permission checks
// - Discount/pricing calculations
// - Data validation rules
// - Error handling paths

// NICE TO HAVE:
// - CRUD operations
// - Simple transformations

// ít cần test:
// - Framework boilerplate (controller routing)
// - Simple getters/setters
// - Generated code
```

### Test Matrix cho nghiệp vụ quan trọng
```
Function: processPayment(order, paymentMethod)

Test cases cần cover:
✅ Happy path: payment thành công
✅ Payment bị decline (insufficient funds)
✅ Payment timeout (external service không respond)
✅ Network error khi gọi payment gateway
✅ Order đã được thanh toán rồi (duplicate payment)
✅ Order không tồn tại
✅ Amount = 0
✅ Amount âm
✅ Currency không hỗ trợ
✅ Payment method không hỗ trợ
✅ User không có permission
✅ Idempotency: gọi 2 lần với cùng idempotency key
```

---

## 6. Testability Code Smells

```typescript
// ❌ Code khó test: phụ thuộc trực tiếp vào global state
class OrderService {
  async createOrder(dto: CreateOrderDto) {
    const user = await fetch(`/api/users/${dto.userId}`).then(r => r.json()); // ❌ global fetch
    const now = new Date(); // ❌ phụ thuộc vào time thực, khó test
    const id = Math.random().toString(); // ❌ không deterministic
  }
}

// ✅ Code dễ test: inject dependencies
class OrderService {
  constructor(
    private readonly userRepo: UserRepository,      // injectable
    private readonly clock: Clock,                   // injectable time
    private readonly idGenerator: IdGenerator,       // injectable ID
  ) {}

  async createOrder(dto: CreateOrderDto) {
    const user = await this.userRepo.findById(dto.userId); // mockable
    const now = this.clock.now(); // mockable → deterministic test
    const id = this.idGenerator.generate(); // mockable → deterministic
  }
}

// Test dễ dàng với mock
const service = new OrderService(
  mockUserRepo,
  { now: () => new Date('2024-01-01') }, // fixed time
  { generate: () => 'test-id-123' },     // fixed ID
);
```

**Câu hỏi review Testability:**
- [ ] Business logic có thể test mà không cần DB/external service thực không?
- [ ] Hàm có phụ thuộc vào global state (Date.now, Math.random, ...) không?
- [ ] Dependencies có được inject (thay vì new bên trong) không?
- [ ] Pure functions có được tách ra không? (dễ test nhất)
- [ ] Coverage có focus vào business logic quan trọng không?
