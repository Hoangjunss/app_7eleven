# Phase 2 Frontend: Product Listing & Detail (Public)

Kế hoạch chi tiết này vạch ra các bước thực hiện xây dựng giao diện hiển thị danh sách sản phẩm và trang chi tiết sản phẩm public (không yêu cầu đăng nhập) cho dự án 7eleven frontend, sử dụng Next.js 14 (App Router), React Query, Tailwind CSS, và shadcn/ui.

---

## Git Setup
- **Branch:** `feature/frontend-phase2` từ nhánh `develop`
  ```bash
  git checkout develop
  git pull origin develop
  git checkout -b feature/frontend-phase2
  ```
- **Commit convention:** `<type>(<scope>): <subject>` (Ví dụ: `feat(product): add product service and react query hooks`)
- **Nguyên tắc:** Sau khi hoàn thành mỗi task dưới đây, tiến hành commit và push trực tiếp lên nhánh từ xa.

---

## Tasks

### Task 1: Cài đặt thêm components shadcn và tạo service/hooks
- [ ] Di chuyển vào thư mục frontend:
  ```bash
  cd frontend
  ```
- [ ] Cài đặt/bổ sung các components shadcn cần thiết:
  ```bash
  npx shadcn-ui@latest add card skeleton select pagination
  ```
- [ ] Tạo file `src/services/productService.ts` định nghĩa kiểu dữ liệu (`Product`, `Category`, `PageResponse`) và các hàm fetch sử dụng `apiClient` đã cấu hình ở Phase 1:
  - `getProducts(params: { page: number, size: number, search?: string, categoryId?: string, minPrice?: number, maxPrice?: number })`
  - `getProductById(id: string)`
  - `getCategories()`
- [ ] Tạo hook `src/hooks/useProducts.ts` sử dụng `useQuery` của React Query để quản lý danh sách sản phẩm theo query params.
- [ ] Tạo hook `src/hooks/useProductDetail.ts` sử dụng `useQuery` để lấy chi tiết sản phẩm theo `id`.
- [ ] Tạo hook `src/hooks/useCategories.ts` sử dụng `useQuery` lấy danh sách danh mục cho bộ lọc.
- **Git commit:** `feat(product): add product service and react query hooks`

### Task 2: ProductCard component
- [ ] Tạo file `src/components/product/ProductCard.tsx` hiển thị thông tin sản phẩm:
  - Ảnh đại diện sản phẩm (sử dụng `next/image` với fallback UI khi load lỗi).
  - Tên sản phẩm, giá bán, danh mục.
  - Nút "Xem chi tiết" dẫn link tới `/products/[id]`.
- [ ] Định dạng style giao diện theo **dark theme**, hiệu ứng kính mờ (**glassmorphism**), border mỏng sáng `border-white/10`, hiệu ứng di chuột chuyển động mượt (`hover:scale-[1.02] transition-transform`).
- **Git commit:** `feat(product): add ProductCard component`

### Task 3: ProductGrid và FilterSidebar
- [ ] Tạo file `src/components/product/ProductGrid.tsx`:
  - Nhận vào danh sách sản phẩm và render danh sách sử dụng `ProductCard`.
  - Hiển thị theo layout responsive: 1 cột trên mobile, 2 cột trên tablet, 4 cột trên desktop.
- [ ] Tạo file `src/components/product/FilterSidebar.tsx`:
  - Thanh tìm kiếm sản phẩm: Tích hợp logic **debounce 300ms** để tránh spam API liên tục khi gõ phím.
  - Dropdown select chọn danh mục (fetch từ `useCategories`).
  - Lọc theo khoảng giá (Min Price, Max Price) với nút áp dụng hoặc cập nhật tự động.
- **Git commit:** `feat(product): add ProductGrid and FilterSidebar`

### Task 4: Trang danh sách sản phẩm (Home)
- [ ] Sửa file `src/app/page.tsx` (trang chủ) để làm trang danh sách sản phẩm public:
  - Tích hợp `FilterSidebar` bên trái (hoặc phía trên trên mobile) và `ProductGrid` bên phải kèm `Pagination`.
  - Quản lý trạng thái bộ lọc (page, search, categoryId, minPrice, maxPrice) đồng bộ với URL query params (để hỗ trợ chia sẻ link hoặc refresh trang không mất filter).
  - Gọi hook `useProducts` truyền vào filter state hiện tại.
- [ ] Thiết lập trạng thái tải dữ liệu: Hiển thị bộ xương tải trang (**Skeleton loader** dạng grid) khi đang fetch dữ liệu.
- [ ] Thiết lập thông báo lỗi: Sử dụng toast (`sonner`) để thông báo cho người dùng khi API có lỗi.
- **Git commit:** `feat(product): implement product listing page with pagination and filters`

### Task 5: Trang chi tiết sản phẩm
- [ ] Tạo thư mục và file `src/app/products/[id]/page.tsx` (trang dynamic route):
  - Lấy `id` từ params, gọi hook `useProductDetail(id)`.
  - Hiển thị cấu trúc trang thông tin sản phẩm chuyên sâu: ảnh chính nổi bật ở một bên, gallery ảnh phụ bên dưới, thông tin tên, giá, số lượng tồn kho (stock), danh mục và mô tả chi tiết ở bên còn lại.
  - Nút "Thêm vào giỏ" (thực hiện log ra console, chuẩn bị sẵn kết nối state cho Phase 3).
- **Git commit:** `feat(product): add product detail page`

### Task 6: Error boundaries và tối ưu
- [ ] Cấu hình Error Boundary hoặc fallback UI cho các lỗi phát sinh trong trang danh sách/trang chi tiết sản phẩm.
- [ ] Cấu hình tối ưu hóa hình ảnh với `next/image`:
  - Thêm domain lưu trữ hình ảnh Cloudinary vào file `next.config.js` hoặc `next.config.ts`.
  - Đảm bảo thuộc tính `sizes` responsive phù hợp và đặt `priority` cho các hình ảnh đầu tiên ở màn hình đầu để cải thiện chỉ số LCP.
- [ ] Kiểm tra tổng thể trạng thái tải (loading state), trạng thái không có dữ liệu (empty state) và giao diện responsive.
- **Git commit:** `fix(product): add error handling and optimize images`

---

## Verification Checklist
- [ ] Danh sách sản phẩm hiển thị đúng phân trang (page, size) và thay đổi trang hoạt động chính xác.
- [ ] Tìm kiếm với cơ chế debounce hoạt động ổn định, không trigger API liên tục khi đang gõ.
- [ ] Bộ lọc theo danh mục và khoảng giá hoạt động chính xác, đồng bộ dữ liệu chuẩn.
- [ ] Click vào thẻ sản phẩm chuyển hướng chính xác đến trang chi tiết của sản phẩm đó.
- [ ] Trang chi tiết hiển thị đầy đủ, chính xác các thông tin và danh sách hình ảnh của sản phẩm.
- [ ] Giao diện dark theme, phong cách glassmorphism hiện đại, responsive mượt mà trên Mobile, Tablet và Desktop.
- [ ] Không có lỗi console log nghiêm trọng hay lỗi TypeScript.
- [ ] Chạy thử lệnh build `npm run build` thành công mà không có lỗi.

---

## Pull Request
Sau khi tất cả các task đã hoàn thành và được kiểm tra kỹ lưỡng, thực hiện push nhánh và tạo Pull Request từ `feature/frontend-phase2` vào nhánh `develop`:
- **Tiêu đề PR:** `feat(frontend): Phase 2 - Product Listing & Detail`
- **Mô tả PR:**
  - Liệt kê chi tiết các tính năng mới đã xây dựng.
  - Đính kèm ảnh chụp màn hình UI trên các thiết bị mobile/desktop.
  - Các lưu ý kỹ thuật (ví dụ: các biến môi trường cấu hình Cloudinary nếu có).
