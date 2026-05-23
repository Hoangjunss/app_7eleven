"use client";

import React from "react";
import {
  Clock,
  CheckCircle2,
  Truck,
  PackageCheck,
  Ban,
} from "lucide-react";
import { OrderStatus } from "@/services/orderService";

// ─── Status Configuration ─────────────────────────────────────────────────────

export const STATUS_CONFIG: Record<
  OrderStatus,
  {
    label: string;
    color: string;
    bg: string;
    border: string;
    Icon: React.ElementType;
  }
> = {
  PENDING: {
    label: "Chờ xác nhận",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-400/30",
    Icon: Clock,
  },
  CONFIRMED: {
    label: "Đã xác nhận",
    color: "text-[#0C5CAB]",
    bg: "bg-[#0C5CAB]/10",
    border: "border-[#0C5CAB]/30",
    Icon: CheckCircle2,
  },
  SHIPPING: {
    label: "Đang giao hàng",
    color: "text-violet-400",
    bg: "bg-violet-400/10",
    border: "border-violet-400/30",
    Icon: Truck,
  },
  DELIVERED: {
    label: "Đã giao hàng",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/30",
    Icon: PackageCheck,
  },
  CANCELLED: {
    label: "Đã hủy",
    color: "text-red-400",
    bg: "bg-red-400/10",
    border: "border-red-400/30",
    Icon: Ban,
  },
};

/** Valid status transitions (frontend hint – backend enforces authoritatively) */
export const NEXT_STATES: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["SHIPPING", "CANCELLED"],
  SHIPPING: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

// ─── Component ────────────────────────────────────────────────────────────────

interface OrderStatusBadgeProps {
  status: OrderStatus | string;
  size?: "sm" | "md";
}

export default function OrderStatusBadge({ status, size = "md" }: OrderStatusBadgeProps) {
  const cfg = STATUS_CONFIG[status as OrderStatus] ?? STATUS_CONFIG.PENDING;
  const iconSize = size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5";
  const textSize = size === "sm" ? "text-[10px]" : "text-xs";
  const padding = size === "sm" ? "px-2 py-0.5" : "px-2.5 py-1";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold border ${textSize} ${padding} ${cfg.color} ${cfg.bg} ${cfg.border}`}
    >
      <cfg.Icon className={iconSize} />
      {cfg.label}
    </span>
  );
}
