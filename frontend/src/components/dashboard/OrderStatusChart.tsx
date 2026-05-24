"use client";

import React, { useEffect, useState } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { DashboardKpi } from "@/services/adminDashboardService";

interface OrderStatusChartProps {
  kpi: DashboardKpi | undefined;
  isLoading: boolean;
}

const COLORS = ["#f59e0b", "#6366f1", "#3b82f6", "#10b981", "#ef4444"];
const STATUS_LABELS: Record<string, string> = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  SHIPPING: "Đang giao",
  DELIVERED: "Đã giao",
  CANCELLED: "Đã hủy",
};

export default function OrderStatusChart({ kpi, isLoading }: OrderStatusChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || isLoading) {
    return (
      <div className="h-80 flex items-center justify-center bg-white/5 border border-white/10 rounded-lg animate-pulse">
        <span className="text-zinc-500 text-sm">Đang tải dữ liệu...</span>
      </div>
    );
  }

  const chartData = kpi?.orderCountByStatus
    ? Object.keys(kpi.orderCountByStatus)
        .map((key) => ({
          name: STATUS_LABELS[key] || key,
          value: kpi.orderCountByStatus[key],
        }))
        .filter((item) => item.value > 0)
    : [];

  if (chartData.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center bg-white/5 border border-white/10 rounded-lg">
        <span className="text-zinc-500 text-sm">Không có dữ liệu đơn hàng</span>
      </div>
    );
  }

  return (
    <div className="h-80 w-full mt-4 flex justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="45%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: "#18181b", borderColor: "#3f3f46", borderRadius: "8px", color: "white" }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            formatter={(value) => <span className="text-xs text-zinc-300">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
