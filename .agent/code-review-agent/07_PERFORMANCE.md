# ⚡ Sub-Agent 07 — Performance Review

## Mục đích
Phát hiện các vấn đề về performance ảnh hưởng đến response time, throughput, và resource usage trong production.

---

## 1. Database Performance

### N+1 Query Problem
```typescript
// ❌ N+1: 1 query lấy orders + N queries lấy user cho mỗi order
const orders = await Order.findAll({ where: { status: 'pending' } });
for (const order of orders) {
  order.user = await User.findByPk(order.userId); // N queries!
}
// Với 100 orders → 101 queries

// ✅ Eager loading: 2 queries total
const orders = await Order.findAll({
  where: { status: 'pending' },
  include: [{ model: User, attributes: ['id', 'name', 'email'] }],
});
```

### Missing Indexes
```sql
-- ❌ Không có index trên column hay filter
SELECT * FROM orders WHERE user_id = ? AND status = ? ORDER BY created_at DESC;
-- Full table scan trên bảng hàng triệu rows!

-- ✅ Compound index đúng thứ tự (equality first, range last)
CREATE INDEX idx_orders_user_status_created 
ON orders(user_id, status, created_at DESC);
```

### Pagination thay vì fetch all
```typescript
// ❌ Fetch tất cả rồi slice ở code
const allProducts = await Product.findAll();
const page1 = allProducts.slice(0, 20); // fetch 100k rows về memory

// ✅ Pagination ở DB
const { rows: products, count: total } = await Product.findAndCountAll({
  where: filters,
  limit: pageSize,
  offset: (page - 1) * pageSize,
  order: [['createdAt', 'DESC']],
});

// Cursor-based pagination cho better performance với large dataset
const products = await Product.findAll({
  where: { id: { [Op.gt]: cursor }, ...filters },
  limit: pageSize + 1, // +1 để biết có trang tiếp theo không
  order: [['id', 'ASC']],
});
```

**Câu hỏi review DB Performance:**
- [ ] Có N+1 query không?
- [ ] Column hay filter có index không?
- [ ] Có SELECT * thay vì select cụ thể fields cần thiết không?
- [ ] Pagination có dùng LIMIT/OFFSET không, hay fetch all?
- [ ] COUNT query có slow không (cân nhắc approximate count)?

---

## 2. Caching

### ❌ Không cache
```typescript
// Bad: không cache data ít thay đổi, gọi DB mỗi request
@Get('/products/categories')
async getCategories() {
  // Categories ít khi thay đổi nhưng query mỗi request
  return this.categoryRepo.findAll({ order: [['name', 'ASC']] });
}

// Bad: không cache kết quả tính toán tốn kém
async getDashboardStats(userId: string) {
  // Aggregate query tốn kém, run mỗi lần load dashboard
  const stats = await Order.findAll({
    attributes: [
      [fn('SUM', col('total')), 'totalRevenue'],
      [fn('COUNT', col('id')), 'orderCount'],
    ],
    where: { userId },
  });
  return stats;
}
```

### ✅ Caching đúng chỗ
```typescript
// Good: cache với TTL hợp lý
@Get('/products/categories')
async getCategories() {
  const CACHE_KEY = 'product:categories:all';
  const CACHE_TTL = 10 * 60; // 10 phút
  
  const cached = await redis.get(CACHE_KEY);
  if (cached) return JSON.parse(cached);
  
  const categories = await this.categoryRepo.findAll({
    order: [['name', 'ASC']],
  });
  
  await redis.setex(CACHE_KEY, CACHE_TTL, JSON.stringify(categories));
  return categories;
}

// Good: cache-aside pattern với cache invalidation
async updateCategory(id: string, data: UpdateCategoryDto) {
  const category = await this.categoryRepo.update(id, data);
  
  // Invalidate cache khi data thay đổi
  await redis.del('product:categories:all');
  await redis.del(`product:category:${id}`);
  
  return category;
}

// Good: HTTP caching headers cho static/semi-static data
@Get('/config/public')
async getPublicConfig(@Res() res: Response) {
  const config = await this.configService.getPublicConfig();
  
  res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
  return res.json(config);
}
```

**Câu hỏi review Caching:**
- [ ] Data ít thay đổi (config, categories, ...) có được cache không?
- [ ] Cache có TTL hợp lý không?
- [ ] Cache có được invalidate khi data thay đổi không?
- [ ] Cache stampede (nhiều request miss cache cùng lúc) có được handle không?

---

## 3. Frontend Performance

### Bundle Size
```typescript
// ❌ Import toàn bộ library
import _ from 'lodash'; // 70KB
import * as moment from 'moment'; // 67KB
import { Button } from '@mui/material'; // có thể pull cả library

// ✅ Tree-shakeable imports
import debounce from 'lodash/debounce'; // chỉ import function cần
import { format } from 'date-fns'; // date-fns tree-shakeable
import Button from '@mui/material/Button'; // named import đường dẫn cụ thể
```

### Code Splitting & Lazy Loading
```typescript
// ❌ Import tất cả upfront
import AdminDashboard from './AdminDashboard'; // 500KB component
import ReportGenerator from './ReportGenerator'; // ít dùng

// ✅ Lazy load route-level và feature-level
const AdminDashboard = lazy(() => import('./AdminDashboard'));
const ReportGenerator = lazy(() => import('./ReportGenerator'));

// ✅ Next.js dynamic import
const HeavyChart = dynamic(() => import('./HeavyChart'), {
  loading: () => <Skeleton height={400} />,
  ssr: false, // không cần SSR
});
```

### Render Optimization
```typescript
// ❌ Không memo hoá component tốn kém
function ProductList({ products, filters, onAddToCart }) {
  return (
    <div>
      {products.map(product => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={onAddToCart}
          // onAddToCart tạo mới mỗi render → tất cả ProductCard re-render
        />
      ))}
    </div>
  );
}

// ✅ Memo + stable callbacks
const ProductCard = React.memo(function ProductCard({ product, onAddToCart }) {
  // chỉ re-render khi product hoặc onAddToCart thay đổi
});

function ProductList({ products, filters }) {
  const handleAddToCart = useCallback((productId: string) => {
    cartService.addItem(productId);
  }, []); // stable reference

  return (
    <div>
      {products.map(product => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={handleAddToCart}
        />
      ))}
    </div>
  );
}
```

### Virtual List cho Large Lists
```typescript
// ❌ Render 10,000 items vào DOM
return (
  <div>
    {allProducts.map(p => <ProductCard key={p.id} product={p} />)}
    {/* 10,000 DOM nodes → browser hang */}
  </div>
);

// ✅ Virtual list
import { VirtualList } from 'react-virtual';

function ProductListVirtual({ products }) {
  const parentRef = useRef(null);
  
  const virtualizer = useVirtualizer({
    count: products.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120, // estimated item height
  });
  
  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <div
            key={virtualRow.index}
            style={{ transform: `translateY(${virtualRow.start}px)` }}
          >
            <ProductCard product={products[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Câu hỏi review Frontend Performance:**
- [ ] Bundle size có được optimize (tree shaking, code splitting) không?
- [ ] Route-level code splitting có được áp dụng không?
- [ ] List lớn (>100 items) có dùng virtual list không?
- [ ] Image có optimize (WebP, lazy load, correct size) không?
- [ ] Có render blocking script trong `<head>` không?

---

## 4. Memory Leaks

```typescript
// ❌ Memory leak: event listener không được cleanup
function MyComponent() {
  useEffect(() => {
    window.addEventListener('resize', handleResize);
    // ❌ không cleanup → listener tích lũy mỗi khi component mount
  }, []);
}

// ❌ Memory leak: subscription không unsubscribe
function MyComponent() {
  useEffect(() => {
    const subscription = store.subscribe(handleChange);
    // ❌ không unsubscribe
  }, []);
}

// ❌ Memory leak: timer không clear
function MyComponent() {
  useEffect(() => {
    const interval = setInterval(pollData, 5000);
    // ❌ interval chạy mãi kể cả khi component unmount
  }, []);
}

// ✅ Cleanup đầy đủ
function MyComponent() {
  useEffect(() => {
    window.addEventListener('resize', handleResize);
    const subscription = store.subscribe(handleChange);
    const interval = setInterval(pollData, 5000);
    
    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, []);
}
```

**Câu hỏi review Memory Leaks:**
- [ ] useEffect có cleanup function không?
- [ ] Event listener có được removeEventListener không?
- [ ] Timer (setInterval, setTimeout) có được clear không?
- [ ] Observable/subscription có được unsubscribe không?
- [ ] BE: Có giữ reference lớn trong memory không cần thiết không?

---

## 5. API Performance

```typescript
// ❌ Sequential API calls có thể parallel
async function loadDashboard(userId: string) {
  const user = await fetchUser(userId);    // 200ms
  const orders = await fetchOrders(userId); // 300ms
  const stats = await fetchStats(userId);  // 250ms
  // Total: 750ms sequential
}

// ✅ Parallel calls
async function loadDashboard(userId: string) {
  const [user, orders, stats] = await Promise.all([
    fetchUser(userId),    // )
    fetchOrders(userId),  // > concurrent: max(200,300,250) = 300ms
    fetchStats(userId),   // )
  ]);
  // Total: ~300ms
}

// ✅ Response compression
import compression from 'compression';
app.use(compression()); // Gzip responses

// ✅ Pagination cho response lớn
// Đừng trả 10,000 records trong 1 response
// Dùng pagination hoặc streaming
```

**Câu hỏi review API Performance:**
- [ ] API call độc lập có chạy parallel không?
- [ ] Response có được compress (gzip/brotli) không?
- [ ] Response lớn có pagination không?
- [ ] Connection pooling (DB, Redis) có config hợp lý không?
