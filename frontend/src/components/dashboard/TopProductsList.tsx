import React from "react";
import { TopProductData } from "@/services/adminDashboardService";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

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
              <div className="pr-2 flex-grow">
                <span className="text-xs font-semibold text-primary">Top {i + 1}</span>
                <Link
                  href={`/admin/products?highlight=${product.productId}`}
                  className="flex items-center gap-1 text-sm font-semibold text-white hover:text-primary transition-colors cursor-pointer group/link"
                  title={product.productName}
                >
                  <span className="truncate max-w-[160px]">{product.productName}</span>
                  <ExternalLink size={12} className="shrink-0 opacity-50 group-hover/link:opacity-100 transition-opacity" />
                </Link>
              </div>
              <div className="text-right shrink-0">
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
