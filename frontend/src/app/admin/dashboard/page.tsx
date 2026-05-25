"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  useDashboardRevenueStats,
  useDashboardOrderStats,
  useDashboardUserStats,
  useDashboardCategoryRevenue,
  useDashboardTopProducts,
  useDashboardRecentOrders
} from "@/hooks/useAdminDashboard";
import Link from "next/link";
import {
  ExternalLink,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Users,
  Package,
  AlertTriangle,
  Activity,
  Calendar,
  Layers
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";

export default function AdminDashboardPage() {
  const [period, setPeriod] = useState<"today" | "7days" | "30days" | "3months" | "custom">("7days");
  const [customStart, setCustomStart] = useState<string>("");
  const [customEnd, setCustomEnd] = useState<string>("");

  // Tránh lỗi hydration của Recharts trong Next.js
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

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
    } else if (period === "3months") {
      start.setMonth(start.getMonth() - 3);
      start.setHours(0, 0, 0, 0);
    } else if (period === "custom" && customStart && customEnd) {
      const parsedStart = new Date(customStart);
      parsedStart.setHours(0, 0, 0, 0);
      const parsedEnd = new Date(customEnd);
      parsedEnd.setHours(23, 59, 59, 999);
      return {
        startDate: parsedStart.toISOString(),
        endDate: parsedEnd.toISOString(),
      };
    } else {
      // Default: Last 7 days
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
    }

    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };
  }, [period, customStart, customEnd]);

  // API query bindings
  const { data: revenueStats, isLoading: isRevenueStatsLoading } = useDashboardRevenueStats(startDate, endDate);
  const { data: orderStats, isLoading: isOrderStatsLoading } = useDashboardOrderStats(startDate, endDate);
  const { data: userStats, isLoading: isUserStatsLoading } = useDashboardUserStats(startDate, endDate);
  const { data: categoryRevenue, isLoading: isCategoryLoading } = useDashboardCategoryRevenue(startDate, endDate);
  const { data: topProducts, isLoading: isTopLoading } = useDashboardTopProducts(startDate, endDate);
  const { data: recentOrders, isLoading: isRecentLoading } = useDashboardRecentOrders(5);

  const formatVND = (num: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(num || 0);
  };

  const STATUS_COLORS: Record<string, string> = {
    PENDING: "#f59e0b",   // Amber
    CONFIRMED: "#6366f1", // Indigo
    SHIPPING: "#3b82f6",  // Blue
    DELIVERED: "#10b981", // Emerald
    CANCELLED: "#ef4444", // Red
  };

  const pieData = useMemo(() => {
    if (!orderStats?.statusDistribution) return [];
    return Object.entries(orderStats.statusDistribution)
      .map(([status, count]) => ({
        name: status === "PENDING" ? "Chờ xác nhận" :
              status === "CONFIRMED" ? "Đã xác nhận" :
              status === "SHIPPING" ? "Đang giao" :
              status === "DELIVERED" ? "Hoàn thành" : "Đã hủy",
        value: Number(count),
        color: STATUS_COLORS[status] || "#9ca3af"
      }))
      .filter(item => item.value > 0);
  }, [orderStats]);

  return (
    <div className="p-6 space-y-8 bg-[#09090b] text-white min-h-screen">
      {/* Top Title & Time Filter */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-[#0C5CAB] to-blue-400 bg-clip-text text-transparent">
            Thống Kê Cửa Hàng
          </h1>
          <p className="text-zinc-400 mt-1">Xem tổng quan hoạt động kinh doanh và số liệu thống kê chi tiết.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {period === "custom" && (
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-2">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="bg-zinc-900 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-primary"
              />
              <span className="text-xs text-zinc-400">đến</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="bg-zinc-900 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-primary"
              />
            </div>
          )}

          <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-1">
            {(["today", "7days", "30days", "3months", "custom"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  period === p ? "bg-primary text-white shadow" : "text-zinc-400 hover:text-white"
                }`}
              >
                {p === "today" ? "Hôm nay" :
                 p === "7days" ? "7 ngày qua" :
                 p === "30days" ? "30 ngày qua" :
                 p === "3months" ? "3 tháng qua" : "Tự chọn"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Doanh thu Card */}
        <div className="bg-[#09090b]/40 border border-white/10 rounded-xl p-5 backdrop-blur-md flex flex-col justify-between">
          <div className="flex justify-between items-center text-zinc-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Tổng doanh thu</span>
            <Activity className="h-5 w-5 text-primary" />
          </div>
          {isRevenueStatsLoading ? (
            <div className="animate-pulse bg-white/5 h-8 rounded w-24 mb-2" />
          ) : (
            <div>
              <div className="text-2xl font-bold text-white">
                {formatVND(revenueStats?.totalRevenue || 0)}
              </div>
              <div className="mt-2 flex items-center text-xs">
                {revenueStats?.percentageChange >= 0 ? (
                  <span className="text-emerald-400 font-medium flex items-center gap-0.5">
                    <TrendingUp size={14} /> +{revenueStats?.percentageChange.toFixed(2)}%
                  </span>
                ) : (
                  <span className="text-rose-400 font-medium flex items-center gap-0.5">
                    <TrendingDown size={14} /> {revenueStats?.percentageChange.toFixed(2)}%
                  </span>
                )}
                <span className="text-zinc-500 ml-2">so với kỳ trước</span>
              </div>
            </div>
          )}
        </div>

        {/* Đơn hàng Card */}
        <div className="bg-[#09090b]/40 border border-white/10 rounded-xl p-5 backdrop-blur-md flex flex-col justify-between">
          <div className="flex justify-between items-center text-zinc-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Tổng đơn hàng</span>
            <ShoppingBag className="h-5 w-5 text-indigo-400" />
          </div>
          {isOrderStatsLoading ? (
            <div className="animate-pulse bg-white/5 h-8 rounded w-16 mb-2" />
          ) : (
            <div>
              <div className="text-2xl font-bold text-white">
                {orderStats?.totalOrders || 0}
              </div>
              <div className="mt-2 flex items-center text-xs">
                {orderStats?.percentageChange >= 0 ? (
                  <span className="text-emerald-400 font-medium flex items-center gap-0.5">
                    <TrendingUp size={14} /> +{orderStats?.percentageChange.toFixed(2)}%
                  </span>
                ) : (
                  <span className="text-rose-400 font-medium flex items-center gap-0.5">
                    <TrendingDown size={14} /> {orderStats?.percentageChange.toFixed(2)}%
                  </span>
                )}
                <span className="text-zinc-500 ml-2">so với kỳ trước</span>
              </div>
            </div>
          )}
        </div>

        {/* Người dùng đăng ký Card */}
        <div className="bg-[#09090b]/40 border border-white/10 rounded-xl p-5 backdrop-blur-md flex flex-col justify-between">
          <div className="flex justify-between items-center text-zinc-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Đăng ký mới</span>
            <Users className="h-5 w-5 text-emerald-400" />
          </div>
          {isUserStatsLoading ? (
            <div className="animate-pulse bg-white/5 h-8 rounded w-16 mb-2" />
          ) : (
            <div>
              <div className="text-2xl font-bold text-white">
                +{userStats?.newUsers || 0}
              </div>
              <div className="mt-2 text-xs text-zinc-500">
                Tổng {userStats?.totalUsers || 0} thành viên hoạt động
              </div>
            </div>
          )}
        </div>

        {/* Tài khoản bị khóa Card */}
        <div className="bg-[#09090b]/40 border border-white/10 rounded-xl p-5 backdrop-blur-md flex flex-col justify-between">
          <div className="flex justify-between items-center text-zinc-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Tài khoản bị khóa</span>
            <AlertTriangle className="h-5 w-5 text-rose-400" />
          </div>
          {isUserStatsLoading ? (
            <div className="animate-pulse bg-white/5 h-8 rounded w-16 mb-2" />
          ) : (
            <div>
              <div className="text-2xl font-bold text-white">
                {userStats?.lockedUsers || 0}
              </div>
              <div className="mt-2 text-xs text-zinc-500">
                Yêu cầu quản trị viên hỗ trợ mở khóa
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Doanh thu xu hướng */}
        <div className="lg:col-span-2 bg-[#09090b]/40 border border-white/10 rounded-xl p-5 backdrop-blur-md">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar size={18} /> Xu hướng Doanh thu & Đơn hàng
          </h2>
          {isMounted && !isRevenueStatsLoading ? (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueStats?.chartData || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0C5CAB" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#0C5CAB" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="#71717a"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => {
                      const d = new Date(val);
                      return `${d.getDate()}/${d.getMonth() + 1}`;
                    }}
                  />
                  <YAxis
                    stroke="#71717a"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => (val >= 1000000 ? `${(val / 1000000).toFixed(0)}M` : val.toLocaleString())}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#18181b", borderColor: "#3f3f46", borderRadius: "8px", color: "white" }}
                    formatter={(value: any) => [formatVND(value), "Doanh thu"]}
                    labelFormatter={(label) => `Ngày: ${new Date(label).toLocaleDateString("vi-VN")}`}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#0C5CAB" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center bg-white/5 border border-white/10 rounded-lg animate-pulse" />
          )}
        </div>

        {/* Trạng thái đơn hàng */}
        <div className="bg-[#09090b]/40 border border-white/10 rounded-xl p-5 backdrop-blur-md flex flex-col justify-between">
          <h2 className="text-lg font-semibold mb-4">Tỉ lệ Trạng thái Đơn hàng</h2>
          {isMounted && !isOrderStatsLoading ? (
            pieData.length > 0 ? (
              <div className="h-64 w-full flex flex-col items-center justify-center">
                <ResponsiveContainer width="100%" height="90%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: "#18181b", borderColor: "#3f3f46", borderRadius: "8px", color: "white" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-2">
                  {pieData.map((entry, index) => (
                    <div key={index} className="flex items-center gap-1.5 text-xs text-zinc-400">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                      {entry.name} ({entry.value})
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex-grow flex items-center justify-center text-zinc-500 text-sm">
                Không có dữ liệu đơn hàng nào trong khoảng thời gian này.
              </div>
            )
          ) : (
            <div className="h-64 flex items-center justify-center bg-white/5 border border-white/10 rounded-lg animate-pulse" />
          )}
        </div>
      </div>

      {/* User registration and Category charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Biểu đồ cột đăng ký mới */}
        <div className="bg-[#09090b]/40 border border-white/10 rounded-xl p-5 backdrop-blur-md">
          <h2 className="text-lg font-semibold mb-4">Lượt Đăng Ký Thành Viên Mới</h2>
          {isMounted && !isUserStatsLoading ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={userStats?.chartData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="#71717a"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => {
                      const d = new Date(val);
                      return `${d.getDate()}/${d.getMonth() + 1}`;
                    }}
                  />
                  <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#18181b", borderColor: "#3f3f46", borderRadius: "8px", color: "white" }}
                    labelFormatter={(label) => `Ngày: ${new Date(label).toLocaleDateString("vi-VN")}`}
                  />
                  <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center bg-white/5 border border-white/10 rounded-lg animate-pulse" />
          )}
        </div>

        {/* Doanh thu theo category */}
        <div className="bg-[#09090b]/40 border border-white/10 rounded-xl p-5 backdrop-blur-md">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Layers size={18} /> Doanh thu Theo Danh mục
          </h2>
          {isMounted && !isCategoryLoading ? (
            categoryRevenue && categoryRevenue.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryRevenue} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="categoryName" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis
                      stroke="#71717a"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => (val >= 1000000 ? `${(val / 1000000).toFixed(0)}M` : val.toLocaleString())}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#18181b", borderColor: "#3f3f46", borderRadius: "8px", color: "white" }}
                      formatter={(value: any) => [formatVND(value), "Doanh thu"]}
                    />
                    <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-zinc-500 text-sm">
                Không phát sinh doanh thu cho bất kỳ danh mục nào.
              </div>
            )
          ) : (
            <div className="h-64 flex items-center justify-center bg-white/5 border border-white/10 rounded-lg animate-pulse" />
          )}
        </div>
      </div>

      {/* Grid: Recent Orders & Top Sold Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders table */}
        <div className="lg:col-span-2 bg-[#09090b]/40 border border-white/10 rounded-xl p-5 backdrop-blur-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <ShoppingBag size={18} /> Đơn hàng gần đây
            </h2>
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
                        <Link href={`/admin/orders/${order.id}`}>{order.orderCode}</Link>
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

        {/* Top Sold Products */}
        <div className="bg-[#09090b]/40 border border-white/10 rounded-xl p-5 backdrop-blur-md flex flex-col justify-between">
          <h2 className="text-lg font-semibold mb-4 text-emerald-400 flex items-center gap-2">
            <TrendingUp size={18} /> Top 5 Bán chạy
          </h2>
          <div className="overflow-y-auto max-h-72">
            {isTopLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="animate-pulse bg-white/5 h-12 rounded-lg" />
                ))}
              </div>
            ) : topProducts && topProducts.length > 0 ? (
              <div className="space-y-3">
                {topProducts.map((prod: any, idx: number) => (
                  <div
                    key={prod.productId}
                    className="p-3 bg-white/5 border border-white/10 rounded-lg flex justify-between items-center"
                  >
                    <div className="min-w-0">
                      <h4 className="text-xs font-semibold text-white truncate max-w-[150px]">
                        {idx + 1}. {prod.productName}
                      </h4>
                      <p className="text-[10px] text-zinc-400 mt-0.5">Doanh thu {formatVND(prod.totalRevenue)}</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                        Đã bán {prod.totalQuantitySold}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-zinc-500 text-sm text-center py-6">Không có dữ liệu bán chạy.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
