import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Giỏ hàng của bạn",
  description: "Xem lại danh sách sản phẩm và chuẩn bị thanh toán tại 7Eleven Shop",
};

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
