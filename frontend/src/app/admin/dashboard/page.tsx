"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useDashboardKpi, useDashboardRevenue, useDashboardTopProducts, useDashboardRecentOrders } from "@/hooks/useAdminDashboard";
import KpiCards from "@/components/dashboard/KpiCards";
import RevenueChart from "@/components/dashboard/RevenueChart";
import OrderStatusChart from "@/components/dashboard/OrderStatusChart";
import TopProductsList from "@/components/dashboard/TopProductsList";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

export default function AdminDashboardPage() {
  const [period, setPeriod] = useState<"today" | "7days" | "30days">("7days");

  const { startDate, endDate } = useMemo(() => {
    const end = new Date();
    const start = new Date();

    if (period === "today") {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (period === "7days") {
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
    } else if (period === "30days") {
      start.setDate(start.getDate() - 29);
      start.setHours(0, 0, 0, 0);
    }

    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };
  }, [period]);

  const { data: kpi, isLoading: isKpiLoading } = useDashboardKpi(startDate, endDate);
  const { data: revenue, isLoading: isRevenueLoading } = useDashboardRevenue(startDate, endDate);
  const { data: topProducts, isLoading: isTopLoading } = useDashboardTopProducts(startDate, endDate);
  const { data: recentOrders, isLoading: isRecentLoading } = useDashboardRecentOrders(5);

  const formatVND = (num: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(num || 0);
  };

  return (
    <div className="p-6 space-y-6 bg-[#09090b] text-white min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-[#0C5CAB] to-blue-400 bg-clip-text text-transparent">Thống Kê Cửa Hàng</h1>
          <p className="text-zinc-400 mt-1">Xem tổng quan hoạt động kinh doanh của cửa hàng.</p>
        </div>

        {/* Date Filter Selection */}
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-1">
          <button
            onClick={() => setPeriod("today")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${period === "today" ? "bg-primary text-white shadow" : "text-zinc-400 hover:text-white"}`}
          >
            Hôm nay
          </button>
          <button
            onClick={() => setPeriod("7days")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${period === "7days" ? "bg-primary text-white shadow" : "text-zinc-400 hover:text-white"}`}
          >
            7 ngày qua
          </button>
          <button
            onClick={() => setPeriod("30days")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${period === "30days" ? "bg-primary text-white shadow" : "text-zinc-400 hover:text-white"}`}
          >
            Tháng này
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <KpiCards kpi={kpi} isLoading={isKpiLoading} formatVND={formatVND} />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#09090b]/40 border border-white/10 rounded-xl p-5 backdrop-blur-md">
          <h2 className="text-lg font-semibold mb-4">Xu Hướng Doanh Thu</h2>
          <RevenueChart data={revenue} isLoading={isRevenueLoading} formatVND={formatVND} />
        </div>
        <div className="bg-[#09090b]/40 border border-white/10 rounded-xl p-5 backdrop-blur-md">
          <h2 className="text-lg font-semibold mb-4">Trạng Thái Đơn Hàng</h2>
          <OrderStatusChart kpi={kpi} isLoading={isKpiLoading} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Products */}
        <div className="bg-[#09090b]/40 border border-white/10 rounded-xl p-5 backdrop-blur-md">
          <h2 className="text-lg font-semibold mb-4">Top 5 Sản Phẩm Bán Chạy</h2>
          <TopProductsList data={topProducts} isLoading={isTopLoading} />
        </div>

        {/* Recent Orders Table */}
        <div className="lg:col-span-2 bg-[#09090b]/40 border border-white/10 rounded-xl p-5 backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Đơn Hàng Gần Đây</h2>
              <Link href="/admin/orders" className="text-primary hover:underline text-xs flex items-center gap-1">
                Xem tất cả đơn hàng <ExternalLink size={12} />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-zinc-400 border-b border-white/10 uppercase">
                  <tr>
                    <th className="py-3">Mã đơn</th>
                    <th className="py-3">Khách hàng</th>
                    <th className="py-3">Tổng tiền</th>
                    <th className="py-3">Trạng thái</th>
                    <th className="py-3">Thời gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {isRecentLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="py-3.5"><div className="h-4 bg-white/5 rounded w-16" /></td>
                        <td className="py-3.5"><div className="h-4 bg-white/5 rounded w-24" /></td>
                        <td className="py-3.5"><div className="h-4 bg-white/5 rounded w-20" /></td>
                        <td className="py-3.5"><div className="h-6 bg-white/5 rounded-full w-16" /></td>
                        <td className="py-3.5"><div className="h-4 bg-white/5 rounded w-20" /></td>
                      </tr>
                    ))
                  ) : recentOrders && recentOrders.length > 0 ? (
                    recentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3.5 font-medium text-primary">
                          <Link href={`/admin/orders/${order.id}`}>
                            {order.orderCode}
                          </Link>
                        </td>
                        <td className="py-3.5">{order.recipientName}</td>
                        <td className="py-3.5 font-semibold text-emerald-400">{formatVND(order.totalAmount)}</td>
                        <td className="py-3.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                            order.status === "DELIVERED" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                            order.status === "CANCELLED" ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" :
                            order.status === "SHIPPING" ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" :
                            order.status === "CONFIRMED" ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30" :
                            "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3.5 text-zinc-400">{new Date(order.createdAt).toLocaleDateString("vi-VN")}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-zinc-500">Chưa có đơn hàng nào.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
