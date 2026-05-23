"use client";

import React from "react";
import { TopProductData } from "@/services/adminDashboardService";

interface TopProductsListProps {
  data: TopProductData[] | undefined;
  isLoading: boolean;
}

export default function TopProductsList({ data, isLoading }: TopProductsListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="animate-pulse flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg">
            <div className="space-y-2 w-3/4">
              <div className="h-4 bg-white/5 rounded w-1/2" />
              <div className="h-3 bg-white/5 rounded w-1/3" />
            </div>
            <div className="h-6 bg-white/5 rounded w-12" />
          </div>
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-zinc-500 text-sm">
        Chưa có sản phẩm bán chạy trong kì lọc.
      </div>
    );
  }

  // Find max sold value as progress bar reference
  const maxSold = Math.max(...data.map(p => p.totalQuantitySold), 1);

  return (
    <div className="space-y-4">
      {data.map((product, i) => {
        const percentage = Math.min(Math.round((product.totalQuantitySold / maxSold) * 100), 100);
        return (
          <div key={product.productId} className="bg-white/5 border border-white/10 rounded-lg p-3 space-y-2 hover:bg-white/10 transition-colors">
            <div className="flex justify-between items-start">
              <div className="pr-2">
                <span className="text-xs font-semibold text-primary">Top {i + 1}</span>
                <h3 className="text-sm font-semibold truncate max-w-[200px]" title={product.productName}>
                  {product.productName}
                </h3>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-emerald-400">{product.totalQuantitySold} sản phẩm</span>
              </div>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-zinc-800 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-primary to-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
