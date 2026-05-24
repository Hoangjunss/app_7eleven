# 📖 Quick Reference — Code Review Cheatsheet

Tổng hợp nhanh tất cả checklist để dùng khi review.

---

## 🧹 Clean Code
- [ ] Tên biến/hàm tự giải thích được không cần comment?
- [ ] Magic number/string đã được đặt constant chưa?
- [ ] Hàm làm > 1 việc không? Có thể tách ra không?
- [ ] Hàm > 4 tham số? → gom vào object
- [ ] Nested > 3 cấp? → early return
- [ ] Code lặp (DRY violation)?
- [ ] Comment giải thích WHY, không phải WHAT?
- [ ] Code bị comment out?
- [ ] Null check đầy đủ chưa?

## 🏗️ SOLID
- [ ] **S**: Class có hơn 1 lý do để thay đổi không?
- [ ] **O**: Thêm feature mới có phải sửa code cũ không?
- [ ] **L**: Subclass có thay thế được parent không?
- [ ] **I**: Interface có method mà class không dùng không?
- [ ] **D**: Business logic có `new ConcreteClass()` không? → Inject dependencies

## 🎨 Frontend
- [ ] Component > 150 dòng? → tách nhỏ
- [ ] State > 5-6? → useReducer / Zustand
- [ ] Prop drilling > 2-3 cấp? → Context / Zustand
- [ ] Logic tách ra custom hook chưa?
- [ ] useEffect deps array đúng chưa?
- [ ] Có tạo object/function trong render mà pass vào memo component không?
- [ ] List key dùng id, không dùng index?
- [ ] React Query/SWR cho server state chưa?
- [ ] div làm button? → semantic HTML
- [ ] Image có alt text không?

## ⚙️ Backend
- [ ] URL dùng danh từ, HTTP method đúng không?
- [ ] HTTP status code đúng không?
- [ ] Response format nhất quán không?
- [ ] N+1 query không?
- [ ] Filter/sort ở DB, không ở code?
- [ ] Transaction khi multi-step mutation?
- [ ] SQL injection risk?
- [ ] Input từ client có được validate không?
- [ ] userId từ JWT không phải từ body?

## 🔥 Edge Cases
- [ ] Null/undefined/empty string input?
- [ ] Số âm, số 0, số max?
- [ ] Date invalid, date tương lai?
- [ ] Empty array?
- [ ] Race condition (check-then-act)?
- [ ] External API timeout?
- [ ] Retry có backoff không?
- [ ] Float arithmetic cho tiền? → dùng integer (cents)
- [ ] Duplicate request? → idempotency

## 🔒 Security
- [ ] Check AUTHORIZATION, không chỉ authentication?
- [ ] JWT secret từ env? JWT algorithm whitelist?
- [ ] SQL injection (string interpolation)?
- [ ] XSS (dangerouslySetInnerHTML, render user content)?
- [ ] Sensitive data trong response/log?
- [ ] Hardcoded credentials?
- [ ] Rate limiting cho auth endpoint?
- [ ] CORS config không quá rộng?
- [ ] Security headers (Helmet)?

## ⚡ Performance
- [ ] N+1 query?
- [ ] SELECT * → chọn field cụ thể?
- [ ] Pagination cho list lớn?
- [ ] Index cho column hay filter?
- [ ] Cache cho data ít thay đổi?
- [ ] Cache invalidation đúng không?
- [ ] Parallel calls (Promise.all) cho operation độc lập?
- [ ] Bundle size: tree shaking, code splitting?
- [ ] Virtual list cho list > 100 items?
- [ ] Image optimize?
- [ ] Memory leaks (event listener, timer, subscription cleanup)?

## 🚀 Production Readiness
- [ ] Env variables validate khi startup?
- [ ] Hardcoded URLs/values?
- [ ] SIGTERM/SIGINT graceful shutdown?
- [ ] Health check endpoint?
- [ ] Structured logging với request ID?
- [ ] Error monitoring (Sentry, ...)?
- [ ] Circuit breaker cho external services?
- [ ] Feature flags cho risky feature?
- [ ] Migration backward compatible?

## 🧪 Testing
- [ ] Test name mô tả behavior cụ thể?
- [ ] Mỗi test 1 thing?
- [ ] Happy path + error path + edge cases?
- [ ] Mock chỉ external dependencies?
- [ ] Business logic critical có coverage không?
- [ ] Code có testable không? (dependencies injected)

## 💼 Business Logic
- [ ] Business rules centralized, không duplicate?
- [ ] State transitions được validate?
- [ ] Money dùng integer, không float?
- [ ] Timezone explicit?
- [ ] Financial data có audit trail?

---

## 🚨 Critical Red Flags (Stop the PR ngay lập tức)

Những issue này cần fix **trước khi merge**, không exception:

```
🔴 SQL Injection (string interpolation vào SQL)
🔴 Exposed credentials/secrets trong code
🔴 Missing authorization check (user A đọc data user B)
🔴 Race condition trên financial operations (transfer, payment)
🔴 Float arithmetic cho tính tiền/tài chính
🔴 Sensitive data (password, token) trong logs
🔴 N+1 query trong hot path (API gọi nhiều lần)
🔴 Missing transaction khi cần atomicity
🔴 Unhandled Promise rejection có thể crash process
🔴 dangerouslySetInnerHTML với user content không sanitize
```

---

## 💡 Code Review Mindset

Khi review, luôn hỏi:

1. **"Điều gì xảy ra nếu...?"**
   - Input là null/undefined/empty?
   - Service external bị down?
   - 2 users thực hiện cùng lúc?
   - Server restart giữa chừng?

2. **"Làm sao để debug khi lỗi xảy ra lúc 2 giờ sáng?"**
   - Log có đủ context không?
   - Error message có rõ ràng không?
   - Có request ID để trace không?

3. **"6 tháng nữa người khác đọc code này có hiểu không?"**
   - Naming có tự giải thích không?
   - Business logic có được document không?
   - Cấu trúc có nhất quán không?

4. **"Code có fail safe không?"**
   - Có circuit breaker không?
   - Có timeout không?
   - Có fallback khi lỗi không?
