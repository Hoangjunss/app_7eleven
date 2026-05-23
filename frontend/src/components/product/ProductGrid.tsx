"use client";

import React from "react";
import ProductCard from "./ProductCard";
import { Product } from "@/services/productService";
import { Inbox } from "lucide-react";

interface ProductGridProps {
  products: Product[];
}

export default function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 rounded-xl border border-dashed border-white/10 bg-white/5 backdrop-blur-sm text-center">
        <Inbox className="h-12 w-12 text-zinc-500 mb-4 animate-pulse" />
        <h3 className="text-lg font-medium text-white mb-1">Không tìm thấy sản phẩm</h3>
        <p className="text-sm text-zinc-400 max-w-xs">
          Vui lòng thử tìm kiếm bằng từ khóa khác hoặc điều chỉnh bộ lọc.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
