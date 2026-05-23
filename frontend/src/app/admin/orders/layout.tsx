import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quản lý đơn hàng (Admin)",
  description: "Trang dành riêng cho Quản trị viên xử lý trạng thái và duyệt đơn hàng tại 7Eleven Shop",
};

export default function AdminOrdersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
