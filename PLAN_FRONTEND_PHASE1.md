# Kế hoạch chi tiết Phase 1 Frontend – Dự án & Xác thực (Auth)

Tài liệu này vạch ra kế hoạch chi tiết cho Phase 1 xây dựng giao diện ứng dụng Next.js 14, cấu hình các thư viện cốt lõi, tích hợp lưu trữ trạng thái với Zustand, đồng bộ server state qua React Query, phân quyền Route theo Role, và định dạng layout Dark Theme tuân thủ các quy tắc trong `.agent/fe`.

---

## Quy trình Git & Nhánh làm việc

> [!IMPORTANT]
> Toàn bộ quá trình phát triển Phase 1 Frontend phải tuân thủ nghiêm ngặt quy trình quản lý nhánh và commit dưới đây:
> 1. **Khởi tạo nhánh:** Tạo nhánh mới từ nhánh `develop`:
>    ```bash
>    git checkout develop
>    git pull origin develop
>    git checkout -b feature/frontend-auth
>    ```
> 2. **Cam kết (Commit & Push):** Mỗi task hoàn thành phải thực hiện commit với thông điệp chuẩn Conventional Commits và push trực tiếp lên remote repository.

---

## 1. Tổng quan & Thiết lập Thư mục
- **Mục tiêu:** Khởi tạo dự án Next.js tại thư mục `frontend/`, cấu hình TypeScript, Tailwind CSS, shadcn/ui (Dark Theme), thiết lập Axios interceptors, Zustand Auth Store, và bảo vệ routes theo vai trò (`USER`, `ADMIN`).
- **Thư mục dự án:** `d:/7eleven/frontend` (sử dụng thư mục `src/` làm thư mục chứa mã nguồn chính).
- **Thời gian hoàn thành dự kiến:** 5 giờ.

---

## 2. Danh sách Tasks (Checklist)

### Task 1: Khởi tạo Next.js Project với cấu trúc `src`
Khởi tạo ứng dụng Next.js nằm trong thư mục `frontend` của dự án với tùy chọn sử dụng `src/` directory và App Router.
- [ ] Chạy lệnh khởi tạo:
  ```bash
  npx create-next-app@latest frontend --typescript --tailwind --app --src-dir --import-alias "@/*"
  ```
- [ ] Di chuyển vào thư mục frontend:
  ```bash
  cd frontend
  ```
- [ ] Thực hiện Git commit và push:
  ```bash
  git add .
  git commit -m "feat(frontend): init nextjs project with src directory"
  git push origin feature/frontend-auth
  ```

### Task 2: Cài đặt Thư viện & Thiết lập Giao diện (shadcn/ui)
Cài đặt các dependency cần thiết và đồng bộ thiết lập design system (Dark Theme, primary color `#0C5CAB`, font mặc định hệ thống).
- [ ] Cài đặt các thư viện cốt lõi:
  ```bash
  npm install zustand @tanstack/react-query axios
  npm install @radix-ui/react-icons class-variance-authority clsx tailwind-merge lucide-react
  ```
- [ ] Khởi tạo cấu hình shadcn/ui:
  ```bash
  npx shadcn-ui@latest init
  ```
  *Chọn các tùy chọn khi init:*
  - Style: `Default`
  - Base color: `Slate`
  - CSS variables for colors: `Yes`
- [ ] Cập nhật biến CSS màu sắc trong `frontend/src/app/globals.css` để khớp với chỉ dẫn trong `.agent/fe/shadcn.md`:
  ```css
  @layer base {
    :root {
      --background: 240 10% 4%;          /* #09090b */
      --foreground: 0 0% 98%;            /* #fafafa */
      --card: 240 10% 6%;
      --card-foreground: 0 0% 98%;
      --popover: 240 10% 5%;
      --popover-foreground: 0 0% 98%;
      --primary: 211 85% 37%;            /* #0C5CAB */
      --primary-foreground: 0 0% 98%;
      --secondary: 211 85% 29%;          /* #0a4a8a */
      --secondary-foreground: 0 0% 98%;
      --muted: 240 5% 15%;
      --muted-foreground: 240 5% 65%;
      --accent: 211 85% 37%;
      --accent-foreground: 0 0% 98%;
      --destructive: 0 72% 51%;          /* #ef4444 */
      --destructive-foreground: 0 0% 98%;
      --border: 240 5% 15%;
      --input: 240 5% 15%;
      --ring: 211 85% 37%;
      --radius: 0.75rem;                 /* rounded-xl = 12px */
    }
  }
  ```
- [ ] Thêm các component UI từ thư viện shadcn:
  ```bash
  npx shadcn-ui@latest add button input form card dropdown-menu table pagination dialog label toast
  ```
- [ ] Thực hiện Git commit và push:
  ```bash
  git add .
  git commit -m "feat(frontend): add tailwind config and custom dark theme"
  git push origin feature/frontend-auth
  ```

### Task 3: Cấu hình Axios Instance & API Interceptors
Đảm bảo các request API được đính kèm Token và xử lý tự động khi Token hết hạn (401).
- [ ] Tạo file `frontend/src/lib/axios.ts`.
- [ ] Cấu hình `baseURL` đọc từ biến môi trường `NEXT_PUBLIC_API_URL` (mặc định trỏ về `http://localhost:8080/api/v1`).
- [ ] Cấu hình **Request Interceptor**: Tự động đọc accessToken từ `useAuthStore` của Zustand và gán vào Header `Authorization: Bearer <token>`.
- [ ] Cấu hình **Response Interceptor**: Bắt lỗi `401 Unauthorized` để tự động gọi action `logout()` của Auth Store và điều hướng về trang đăng nhập `/login`.
- [ ] Thực hiện Git commit và push:
  ```bash
  git add .
  git commit -m "feat(auth): add axios interceptor and api client"
  git push origin feature/frontend-auth
  ```

### Task 4: Xây dựng Zustand Auth Store (Persisted)
Lưu giữ trạng thái đăng nhập, thông tin người dùng và vai trò để đồng bộ hóa phiên làm việc.
- [ ] Tạo file `frontend/src/stores/authStore.ts`.
- [ ] Khai báo TypeScript interface mô tả trạng thái Auth:
  ```typescript
  interface UserState {
    email: string;
    fullName: string;
    roles: string[];
  }
  ```
- [ ] Cấu hình store trạng thái: `user` (User State hoặc null), `accessToken` (string hoặc null), `isAuthenticated` (boolean), `role` (string hoặc null).
- [ ] Viết các actions nghiệp vụ:
  - `login(email, password)`: Gọi API `/auth/login`, lưu `token`, `user` vào Store và cập nhật trạng thái đăng nhập.
  - `register(data)`: Gọi API `/auth/register` để đăng ký tài khoản.
  - `logout()`: Xóa sạch dữ liệu trong Store và LocalStorage.
- [ ] Tích hợp Middleware `persist` từ Zustand để đồng bộ hóa tự động lưu trữ token và thông tin user xuống `localStorage`.
- [ ] Thực hiện Git commit và push:
  ```bash
  git add .
  git commit -m "feat(auth): add zustand auth store with persistence"
  git push origin feature/frontend-auth
  ```

### Task 5: Triển khai Component bảo vệ Route (`ProtectedRoute`)
Tạo lớp Wrapper ngăn chặn truy cập trái phép vào các màn hình được bảo vệ hoặc màn hình của Admin.
- [ ] Tạo file `frontend/src/components/ProtectedRoute.tsx`.
- [ ] Định nghĩa các props yêu cầu role cụ thể (ví dụ: `allowedRoles?: string[]`).
- [ ] Đọc trạng thái từ `useAuthStore`:
  - Nếu `isAuthenticated === false` → Redirect về `/login`.
  - Nếu route yêu cầu vai trò `ADMIN` nhưng vai trò hiện tại của user không khớp → Redirect về trang chủ `/`.
  - Nếu hợp lệ → Render `children`.
- [ ] Thực hiện Git commit và push:
  ```bash
  git add .
  git commit -m "feat(route): add protected route guard wrapper"
  git push origin feature/frontend-auth
  ```

### Task 6: Màn hình Đăng ký & Đăng nhập
Xây dựng giao diện biểu mẫu nhập liệu áp dụng Glassmorphism và màu sắc thương hiệu.
- [ ] Tạo trang đăng nhập tại `frontend/src/app/login/page.tsx`:
  - Sử dụng Form của shadcn (`@/components/ui/form`).
  - Giao diện dạng thẻ nổi: `bg-white/5 border border-white/10 rounded-xl shadow-lg shadow-black/20 backdrop-blur-sm`.
  - Xử lý hành động submit, gọi login action từ `authStore`.
  - Điều hướng người dùng sau khi đăng nhập thành công: Admin sang `/admin/products`, User thông thường sang `/`.
  - Hiển thị Toast thông báo lỗi nếu nhập sai credentials.
- [ ] Tạo trang đăng ký tại `frontend/src/app/register/page.tsx`:
  - Thiết kế Form chứa các trường: `email`, `password`, `fullName` (không yêu cầu phone để tương thích tuyệt đối với backend entity).
  - Đăng ký thành công hiển thị Toast thông báo và tự động điều hướng sang `/login`.
- [ ] Thực hiện Git commit và push:
  ```bash
  git add .
  git commit -m "feat(auth): implement login and register pages with forms"
  git push origin feature/frontend-phase1
  ```

### Task 7: Cấu trúc Layout Cơ bản (Header & Admin Sidebar)
- [ ] Xây dựng Header (`frontend/src/components/layout/Header.tsx`):
  - Hiển thị thanh định vị đầu trang: `bg-[#09090b]/80 backdrop-blur-md sticky top-0 border-b border-white/10`.
  - Phía bên phải: Hiển thị Avatar / tên người dùng và menu Dropdown chứa nút **Logout** và link đến trang cá nhân.
- [ ] Xây dựng Admin Sidebar (`frontend/src/components/layout/AdminSidebar.tsx`):
  - Chỉ hiển thị đối với người dùng có vai trò `ADMIN`.
  - Chứa danh sách các liên kết quản trị: `Sản phẩm (Products)`, `Danh mục (Categories)`, `Đơn hàng (Orders)`.
  - Sử dụng hiệu ứng hover `hover:bg-white/10` và nét chữ rõ ràng.
- [ ] Cập nhật Root Layout (`frontend/src/app/layout.tsx`):
  - Tích hợp Providers (React Query Provider, Toast Provider).
  - Thêm Header lên trên cùng và bao quanh thẻ nội dung bằng Grid layout tùy biến theo vai trò.
- [ ] Thực hiện Git commit và push:
  ```bash
  git add .
  git commit -m "feat(layout): add header and admin sidebar components"
  git push origin feature/frontend-phase1
  ```

---

## 3. Hoàn tất Phase 1 & Tạo Pull Request

Sau khi hoàn tất cả 7 task trên, thực hiện các bước sau để đẩy code và tạo Pull Request:
1. **Kiểm tra trạng thái Git:**
   ```bash
   git status
   ```
2. **Push toàn bộ nhánh lên github/remote:**
   ```bash
   git push origin feature/frontend-phase1
   ```
3. **Tạo Pull Request:**
   Truy cập vào repository trên GitHub/GitLab và tạo Pull Request từ nhánh `feature/frontend-phase1` vào nhánh `develop`.
   *Nội dung mẫu Pull Request:*
   ```markdown
   ## Mô tả
   Tích hợp khung dự án Next.js 14 Frontend và luồng xác thực người dùng (Phase 1).

   ## Thay đổi chính
   - Khởi tạo dự án Next.js 14 bằng App Router, TypeScript và cấu hình Tailwind.
   - Thiết lập shadcn/ui với Dark Theme và màu thương hiệu `#0C5CAB`.
   - Cấu hình Axios instance kèm request/response interceptors xử lý đính kèm JWT và lỗi 401.
   - Xây dựng Zustand authStore đồng bộ LocalStorage.
   - Xây dựng component `ProtectedRoute` bảo vệ route theo role.
   - Thiết kế trang Login và Register với form trực quan.
   - Phát triển Header điều hướng và Sidebar dành cho ADMIN.

   ## Cách kiểm thử
   1. Chạy backend qua Docker Compose.
   2. Chạy frontend: `npm run dev`.
   3. Thực hiện đăng ký, đăng nhập tài khoản (USER/ADMIN) và kiểm tra lưu trữ token.
   4. Thử truy cập trang `/admin` và click Logout để xác nhận phân quyền hoạt động tốt.
   ```

---

## 4. Kiểm tra Hoàn thành (Verification Phase)
Sau khi thực hiện xong Phase 1, các tiêu chí sau phải được đáp ứng hoàn toàn:
1. **Không có lỗi biên dịch:** Chạy `npm run dev` khởi động server thành công không xuất hiện lỗi logic/CSS.
2. **Luồng Auth hoạt động đúng:**
   - Đăng ký tài khoản mới lưu thông tin vào database Spring Boot thành công.
   - Đăng nhập thành công trả về JWT token và lưu vào LocalStorage dưới dạng persistent state.
   - Header hiển thị đúng tên người dùng đăng nhập.
3. **Bảo vệ Route (Middleware/Wrapper):**
   - Truy cập vào `/admin` khi chưa đăng nhập hoặc với tài khoản `USER` sẽ bị chặn và redirect phù hợp.
   - Nút Logout xóa sạch token khỏi LocalStorage và đưa người dùng trở lại màn hình `/login`.
4. **API Integration:** Các request gọi đến API cần bảo mật (như `/cart` hoặc `/admin/products`) tự động truyền kèm token qua header `Authorization`.
