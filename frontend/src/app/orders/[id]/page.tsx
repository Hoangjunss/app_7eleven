"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOrderDetail } from "@/hooks/useOrderDetail";
import { useCancelOrder } from "@/hooks/useCancelOrder";
import { formatCurrency } from "@/components/product/ProductCard";
import { OrderStatus } from "@/services/orderService";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  CheckCircle2,
  Package,
  MapPin,
  Phone,
  User,
  FileText,
  Banknote,
  AlertTriangle,
  Home,
  XCircle,
  Loader2,
  Clock,
  Truck,
  PackageCheck,
  Ban,
} from "lucide-react";

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

// ─── Status badge helpers ─────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string; bg: string; border: string; Icon: React.ElementType }
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

function StatusBadge({ status }: { status: OrderStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${cfg.color} ${cfg.bg} ${cfg.border}`}
    >
      <cfg.Icon className="h-3.5 w-3.5" />
      {cfg.label}
    </span>
  );
}

// ─── Order Detail Page ────────────────────────────────────────────────────────

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = React.use(params);
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useOrderDetail(id);
  const cancelMutation = useCancelOrder(id);

  const order = data?.data;

  const handleCancel = async () => {
    if (!confirm("Bạn có chắc muốn hủy đơn hàng này?")) return;
    cancelMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success("Đã hủy đơn hàng thành công.");
        refetch();
      },
      onError: () => {
        toast.error("Không thể hủy đơn hàng. Vui lòng thử lại.");
      },
    });
  };

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto py-6 flex flex-col gap-6">
        <Skeleton className="h-10 w-72 bg-white/10" />
        <Skeleton className="h-6 w-48 bg-white/10" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-52 bg-white/10 rounded-xl" />
          <Skeleton className="h-52 bg-white/10 rounded-xl" />
        </div>
        <Skeleton className="h-64 bg-white/10 rounded-xl" />
      </div>
    );
  }

  // ── Error ──
  if (isError || !order) {
    return (
      <div className="w-full max-w-xl mx-auto py-20 flex flex-col items-center gap-6 text-center">
        <AlertTriangle className="h-16 w-16 text-yellow-500" />
        <div>
          <h2 className="text-xl font-semibold text-white mb-1">Không tìm thấy đơn hàng</h2>
          <p className="text-sm text-zinc-400">
            Đơn hàng không tồn tại hoặc bạn không có quyền xem.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => refetch()}
            variant="ghost"
            className="border border-white/10 hover:bg-white/5 text-white rounded-lg cursor-pointer"
          >
            Thử lại
          </Button>
          <Link href="/">
            <Button className="bg-primary hover:bg-secondary text-white rounded-lg cursor-pointer">
              Về trang chủ
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[order.status as OrderStatus] ?? STATUS_CONFIG.PENDING;
  const canCancel = order.status === "PENDING";
  const isSuccess = order.status !== "CANCELLED";

  const formattedDate = new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(order.createdAt));

  return (
    <div className="w-full max-w-4xl mx-auto py-6 text-white">

      {/* ── Success Banner ── */}
      {isSuccess && (
        <div className="flex items-center gap-4 p-5 mb-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-base font-semibold text-white">Đặt hàng thành công!</p>
            <p className="text-sm text-zinc-400 mt-0.5">
              Chúng tôi sẽ liên hệ xác nhận đơn hàng sớm nhất. Cảm ơn bạn đã mua sắm!
            </p>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Đơn hàng #{order.orderCode}
            </h1>
            <StatusBadge status={order.status as OrderStatus} />
          </div>
          <p className="text-xs text-zinc-500 mt-1">Đặt lúc {formattedDate}</p>
        </div>

        <div className="flex items-center gap-3">
          {canCancel && (
            <Button
              onClick={handleCancel}
              disabled={cancelMutation.isPending}
              variant="ghost"
              className="border border-red-500/30 hover:bg-red-500/10 text-red-400 hover:text-red-300 rounded-lg cursor-pointer h-9 text-sm flex items-center gap-1.5"
            >
              {cancelMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              Hủy đơn hàng
            </Button>
          )}
          <Link href="/">
            <Button
              variant="ghost"
              className="border border-white/10 hover:bg-white/5 text-white/70 hover:text-white rounded-lg cursor-pointer h-9 text-sm flex items-center gap-1.5"
            >
              <Home className="h-4 w-4" />
              Tiếp tục mua sắm
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Info Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

        {/* Delivery Info */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-zinc-300 border-b border-white/10 pb-2">
            Thông tin giao hàng
          </h2>
          <div className="flex flex-col gap-2.5 text-sm">
            <div className="flex items-start gap-2 text-zinc-300">
              <User className="h-4 w-4 text-zinc-500 mt-0.5 shrink-0" />
              <span>{order.recipientName}</span>
            </div>
            <div className="flex items-start gap-2 text-zinc-300">
              <Phone className="h-4 w-4 text-zinc-500 mt-0.5 shrink-0" />
              <span>{order.recipientPhone}</span>
            </div>
            <div className="flex items-start gap-2 text-zinc-300">
              <MapPin className="h-4 w-4 text-zinc-500 mt-0.5 shrink-0" />
              <span className="leading-relaxed">{order.deliveryAddress}</span>
            </div>
            {order.note && (
              <div className="flex items-start gap-2 text-zinc-400">
                <FileText className="h-4 w-4 text-zinc-600 mt-0.5 shrink-0" />
                <span className="italic">{order.note}</span>
              </div>
            )}
          </div>
        </div>

        {/* Payment Info */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-zinc-300 border-b border-white/10 pb-2">
            Thanh toán
          </h2>
          <div className="flex flex-col gap-2.5 text-sm">
            <div className="flex items-center gap-2">
              <Banknote className="h-4 w-4 text-zinc-500 shrink-0" />
              <span className="text-zinc-300">{order.paymentMethod}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-zinc-500 text-xs">Trạng thái:</span>
              <span className="text-zinc-300 text-xs">{order.paymentStatus || "Chờ thanh toán"}</span>
            </div>
          </div>

          <Separator className="bg-white/10 my-1" />

          <div className="flex flex-col gap-1.5 text-sm">
            <div className="flex justify-between text-zinc-400">
              <span>Phí vận chuyển</span>
              <span className="text-emerald-400">Miễn phí</span>
            </div>
            <div className="flex justify-between font-bold text-white text-base">
              <span>Tổng cộng</span>
              <span className="font-mono">{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Order Items ── */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-zinc-300 border-b border-white/10 pb-2 mb-4">
          Sản phẩm đã đặt ({order.items.length} loại)
        </h2>
        <div className="flex flex-col gap-3">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-4 py-3 border-b border-white/5 last:border-0"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white leading-snug line-clamp-2">
                  {item.productNameSnapshot}
                </p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {formatCurrency(item.priceSnapshot)} × {item.quantity}
                </p>
              </div>
              <span className="text-sm font-semibold text-white font-mono shrink-0">
                {formatCurrency(item.subtotal)}
              </span>
            </div>
          ))}
        </div>

        {/* Total row */}
        <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/10">
          <span className="text-sm font-semibold text-zinc-300">Tổng đơn hàng</span>
          <span className="text-xl font-bold text-white font-mono">
            {formatCurrency(order.totalAmount)}
          </span>
        </div>
      </div>

      {/* ── Status Timeline (visual hint) ── */}
      <div className="mt-6 flex items-center justify-between px-4 py-4 bg-white/5 border border-white/10 rounded-xl overflow-x-auto gap-2">
        {(["PENDING", "CONFIRMED", "SHIPPING", "DELIVERED"] as OrderStatus[]).map((s, idx, arr) => {
          const cfg = STATUS_CONFIG[s];
          const statuses: OrderStatus[] = ["PENDING", "CONFIRMED", "SHIPPING", "DELIVERED", "CANCELLED"];
          const currentIdx = statuses.indexOf(order.status as OrderStatus);
          const thisIdx = statuses.indexOf(s);
          const isPast = currentIdx > thisIdx && order.status !== "CANCELLED";
          const isCurrent = order.status === s;

          return (
            <React.Fragment key={s}>
              <div className="flex flex-col items-center gap-1 shrink-0">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center border transition-colors ${
                    isCurrent
                      ? `${cfg.bg} ${cfg.border} ${cfg.color}`
                      : isPast
                      ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                      : "bg-white/5 border-white/10 text-zinc-600"
                  }`}
                >
                  <cfg.Icon className="h-3.5 w-3.5" />
                </div>
                <span
                  className={`text-[10px] font-medium whitespace-nowrap ${
                    isCurrent ? cfg.color : isPast ? "text-emerald-400" : "text-zinc-600"
                  }`}
                >
                  {cfg.label}
                </span>
              </div>
              {idx < arr.length - 1 && (
                <div
                  className={`flex-1 h-px min-w-4 ${
                    isPast ? "bg-emerald-500/40" : "bg-white/10"
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
