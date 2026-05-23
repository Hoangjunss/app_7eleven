import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lịch sử đơn hàng",
  description: "Xem và kiểm tra lịch sử đặt hàng của bạn tại 7Eleven Shop",
};

export default function OrdersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
