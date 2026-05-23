import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Thanh toán đơn hàng",
  description: "Hoàn tất điền thông tin giao hàng để đặt mua sản phẩm tại 7Eleven Shop",
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
