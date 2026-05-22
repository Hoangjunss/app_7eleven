"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Product } from "@/services/productService";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ProductCardProps {
  product: Product;
}

export function formatCurrency(price: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
}

export default function ProductCard({ product }: ProductCardProps) {
  const { id, name, price, categoryName, primaryImageUrl, stockQuantity } = product;

  return (
    <Card className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl shadow-lg shadow-black/20 hover:scale-[1.02] transition-transform duration-300 flex flex-col justify-between h-full group">
      <div>
        {/* Image Section */}
        <div className="relative w-full aspect-square overflow-hidden rounded-t-xl bg-zinc-900 border-b border-white/5">
          {primaryImageUrl ? (
            <Image
              src={primaryImageUrl}
              alt={name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              priority={false}
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full text-zinc-550 text-sm font-medium">
              No Image
            </div>
          )}
          {stockQuantity <= 0 && (
            <div className="absolute top-2 right-2 bg-red-600/90 text-white text-xs px-2 py-1 rounded-md font-semibold backdrop-blur-xs">
              Hết hàng
            </div>
          )}
        </div>

        {/* Info Section */}
        <CardHeader className="pt-4 pb-2 px-4">
          <span className="text-xs uppercase tracking-wider text-primary font-semibold">
            {categoryName || "Chưa phân loại"}
          </span>
          <CardTitle className="line-clamp-2 text-white font-medium text-base mt-1 h-12 leading-snug group-hover:text-primary transition-colors duration-300">
            {name}
          </CardTitle>
        </CardHeader>
      </div>

      <div>
        <CardContent className="px-4 pb-4">
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-bold text-white font-mono">
              {formatCurrency(price)}
            </span>
            <span className="text-xs text-zinc-400">
              Tồn: {stockQuantity}
            </span>
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0 border-t-0 bg-transparent">
          <Link href={`/products/${id}`} className="w-full">
            <Button
              className="w-full bg-[#0C5CAB] hover:bg-[#0a4a8a] text-white rounded-lg transition-all duration-200 font-medium py-2 shadow-md shadow-black/25 flex items-center justify-center gap-1 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#0C5CAB]"
            >
              Xem chi tiết
            </Button>
          </Link>
        </CardFooter>
      </div>
    </Card>
  );
}
