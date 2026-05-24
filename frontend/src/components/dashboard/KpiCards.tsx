"use client";

import React from "react";
import { DollarSign, ShoppingBag, Package, Users } from "lucide-react";
import { DashboardKpi } from "@/services/adminDashboardService";
import { Skeleton } from "@/components/ui/skeleton";

interface KpiCardsProps {
  kpi: DashboardKpi | undefined;
  isLoading: boolean;
  formatVND: (num: number) => string;
}

export default function KpiCards({ kpi, isLoading, formatVND }: KpiCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white/5 border border-white/10 rounded-xl p-5 backdrop-blur-md shadow-lg flex flex-col gap-3"
          >
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-2/3 bg-white/10" />
              <Skeleton className="h-5 w-5 rounded-full bg-white/10" />
            </div>
            <Skeleton className="h-8 w-1/2 bg-white/10 mt-1" />
          </div>
        ))}
      </div>
    );
  }
  const cards = [
    {
      title: "Tổng Doanh Thu (Delivered)",
      value: isLoading ? "..." : formatVND(kpi?.totalRevenue || 0),
      icon: DollarSign,
      color: "from-emerald-500/20 to-teal-500/5 border-emerald-500/30 text-emerald-400",
    },
    {
      title: "Tổng Đơn Hàng (Khoảng lọc)",
      value: isLoading ? "..." : kpi?.totalOrders.toLocaleString() || "0",
      icon: ShoppingBag,
      color: "from-blue-500/20 to-indigo-500/5 border-blue-500/30 text-blue-400",
    },
    {
      title: "Sản Phẩm Đang Bán",
      value: isLoading ? "..." : kpi?.totalProducts.toLocaleString() || "0",
      icon: Package,
      color: "from-purple-500/20 to-pink-500/5 border-purple-500/30 text-purple-400",
    },
    {
      title: "Người Dùng Đăng Ký",
      value: isLoading ? "..." : kpi?.totalUsers.toLocaleString() || "0",
      icon: Users,
      color: "from-amber-500/20 to-orange-500/5 border-amber-500/30 text-amber-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <div
            key={i}
            className={`bg-gradient-to-br ${card.color} border rounded-xl p-5 backdrop-blur-md hover:scale-[1.02] transition-transform duration-200 shadow-lg`}
          >
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-zinc-400">{card.title}</span>
              <Icon size={20} className="opacity-80" />
            </div>
            <div className="mt-3 text-2xl font-bold tracking-tight text-white">
              {card.value}
            </div>
          </div>
        );
      })}
    </div>
  );
}
