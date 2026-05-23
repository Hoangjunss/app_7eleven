"use client";

import React, { useEffect, useState } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { RevenueChartData } from "@/services/adminDashboardService";

interface RevenueChartProps {
  data: RevenueChartData[] | undefined;
  isLoading: boolean;
  formatVND: (num: number) => string;
}

export default function RevenueChart({ data, isLoading, formatVND }: RevenueChartProps) {
  // Tránh lỗi hydration của Recharts trong SSR Next.js
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || isLoading) {
    return (
      <div className="h-80 flex items-center justify-center bg-white/5 border border-white/10 rounded-lg animate-pulse">
        <span className="text-zinc-500 text-sm">Đang tải dữ liệu biểu đồ...</span>
      </div>
    );
  }

  return (
    <div className="h-80 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => {
              const d = new Date(val);
              return `${d.getDate()}/${d.getMonth() + 1}`;
            }}
          />
          <YAxis
            stroke="#71717a"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => (val >= 1000000 ? `${val / 1000000}M` : val.toLocaleString())}
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
  );
}
