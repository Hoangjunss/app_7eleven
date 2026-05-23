import React, { Suspense } from "react";
import type { Metadata } from "next";
import ProductDirectoryClient from "@/components/product/ProductDirectoryClient";

export const metadata: Metadata = {
  title: "Sản phẩm",
  description: "Khám phá danh sách sản phẩm đa dạng và chất lượng tại 7Eleven Shop",
};

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-7xl mx-auto py-16 text-center text-zinc-400">
          Đang tải trang sản phẩm...
        </div>
      }
    >
      <ProductDirectoryClient />
    </Suspense>
  );
}
