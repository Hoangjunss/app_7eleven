"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useAdminOrderDetail } from "@/hooks/useAdminOrderDetail";
import { useUpdateOrderStatus } from "@/hooks/useUpdateOrderStatus";
import { OrderStatus } from "@/services/orderService";
import OrderStatusBadge, {
  NEXT_STATES,
  STATUS_CONFIG,
} from "@/components/order/OrderStatusBadge";
import { formatCurrency } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  Truck,
  PackageCheck,
  Ban,
  AlertTriangle,
  User,
  Phone,
  MapPin,
  FileText,
  Banknote,
  Loader2,
  Package,
} from "lucide-react";

interface AdminOrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function AdminOrderDetailPage({ params }: AdminOrderDetailPageProps) {
  const { id } = React.use(params);
  const router = useRouter();
  const { isAuthenticated, role } = useAuthStore();

  const { data, isLoading, isError, refetch } = useAdminOrderDetail(id);
  const updateStatusMutation = useUpdateOrderStatus(id);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | "">("");

  // Route guard – ADMIN only
  useEffect(() => {
    if (!isAuthenticated || role !== "ADMIN") {
      toast.error("Bạn không có quyền truy cập trang này.");
      router.push("/");
    }
  }, [isAuthenticated, role, router]);

  if (!isAuthenticated || role !== "ADMIN") return null;

  const order = data?.data;

  // ── Loading state ──
  if (isLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto py-6 text-white flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-24 bg-white/10" />
          <Skeleton className="h-9 w-48 bg-white/10" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <Skeleton className="h-40 w-full bg-white/5 rounded-xl" />
            <Skeleton className="h-64 w-full bg-white/5 rounded-xl" />
          </div>
          <div className="flex flex-col gap-6">
            <Skeleton className="h-60 w-full bg-white/5 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  // ── Error state ──
  if (isError || !order) {
    return (
      <div className="w-full max-w-xl mx-auto py-20 flex flex-col items-center gap-6 text-center text-white">
        <AlertTriangle className="h-16 w-16 text-yellow-500" />
        <div>
          <h2 className="text-xl font-semibold text-white mb-1">Không tìm thấy đơn hàng</h2>
          <p className="text-sm text-zinc-400">
            Đơn hàng không tồn tại hoặc hệ thống đã xảy ra lỗi.
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
          <Link href="/admin/orders">
            <Button className="bg-primary hover:bg-secondary text-white rounded-lg cursor-pointer">
              Quay lại danh sách
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentStatus = order.status as OrderStatus;
  const validNextStates = NEXT_STATES[currentStatus] || [];
  const hasNextStates = validNextStates.length > 0;

  const formattedDate = new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(order.createdAt));

  const handleStatusChangeClick = (statusVal: string) => {
    if (!statusVal) return;
    setSelectedStatus(statusVal as OrderStatus);
    setDialogOpen(true);
  };

  const confirmStatusUpdate = () => {
    if (!selectedStatus) return;
    updateStatusMutation.mutate(selectedStatus, {
      onSuccess: () => {
        toast.success(`Đã cập nhật trạng thái đơn hàng thành ${STATUS_CONFIG[selectedStatus].label}.`);
        setDialogOpen(false);
        setSelectedStatus("");
        refetch();
      },
      onError: (err: any) => {
        const errorMsg = err?.response?.data?.message || err?.message || "Có lỗi xảy ra khi cập nhật.";
        toast.error(errorMsg);
        setDialogOpen(false);
        setSelectedStatus("");
      },
    });
  };

  return (
    <div className="w-full max-w-7xl mx-auto py-6 text-white px-4 md:px-0">
      {/* Back button and breadcrumb */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/orders">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 border border-white/10 hover:bg-white/5 text-zinc-300 hover:text-white rounded-lg cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Button>
        </Link>
        <span className="text-zinc-500 text-sm">/</span>
        <span className="text-zinc-400 text-sm">Quản lý đơn hàng</span>
        <span className="text-zinc-500 text-sm">/</span>
        <span className="text-white text-sm font-medium">#{order.orderCode}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Package className="h-6 w-6 text-primary" />
              Đơn hàng #{order.orderCode}
            </h1>
            <OrderStatusBadge status={currentStatus} />
          </div>
          <p className="text-sm text-zinc-400 mt-1">
            Đặt lúc {formattedDate} &bull; User ID: <span className="font-mono text-primary font-semibold">#{order.userId}</span>
          </p>
        </div>
      </div>

      {/* 2 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Order items and address details (60%) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Shipping & Delivery Info */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-5 md:p-6 flex flex-col gap-4">
            <h2 className="text-base font-semibold text-white border-b border-white/10 pb-2 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Thông tin giao hàng
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-start gap-3 text-zinc-300">
                <User className="h-5 w-5 text-zinc-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-zinc-500">Người nhận</p>
                  <p className="font-medium text-white">{order.recipientName}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-zinc-300">
                <Phone className="h-5 w-5 text-zinc-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-zinc-500">Số điện thoại</p>
                  <p className="font-medium text-white">{order.recipientPhone}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-zinc-300 md:col-span-2">
                <MapPin className="h-5 w-5 text-zinc-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-zinc-500">Địa chỉ giao hàng</p>
                  <p className="font-medium text-white leading-relaxed">{order.deliveryAddress}</p>
                </div>
              </div>
              {order.note && (
                <div className="flex items-start gap-3 text-zinc-300 md:col-span-2">
                  <FileText className="h-5 w-5 text-zinc-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-zinc-500">Ghi chú</p>
                    <p className="font-medium text-zinc-400 italic">"{order.note}"</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-5 md:p-6">
            <h2 className="text-base font-semibold text-white border-b border-white/10 pb-2 mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Sản phẩm đã đặt ({order.items.length} mặt hàng)
            </h2>
            <div className="flex flex-col gap-4">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 py-3 border-b border-white/5 last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white leading-snug line-clamp-2">
                      {item.productNameSnapshot}
                    </p>
                    <p className="text-xs text-zinc-400 mt-1">
                      Giá: {formatCurrency(item.priceSnapshot)} &bull; Số lượng: {item.quantity}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-white font-mono shrink-0">
                    {formatCurrency(item.subtotal)}
                  </span>
                </div>
              ))}
            </div>

            {/* Total section */}
            <div className="mt-6 pt-4 border-t border-white/10 flex flex-col gap-2">
              <div className="flex justify-between items-center text-sm text-zinc-400">
                <span>Tạm tính</span>
                <span className="font-mono">{formatCurrency(order.totalAmount)}</span>
              </div>
              <div className="flex justify-between items-center text-sm text-zinc-400">
                <span>Phí vận chuyển</span>
                <span className="text-emerald-400">Miễn phí</span>
              </div>
              <Separator className="bg-white/10 my-2" />
              <div className="flex justify-between items-center text-white">
                <span className="font-semibold">Tổng tiền thanh toán</span>
                <span className="text-xl font-bold font-mono text-primary">
                  {formatCurrency(order.totalAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Order Management & Status panel (40%) */}
        <div className="flex flex-col gap-6">
          {/* Status Update Panel */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-5 md:p-6 flex flex-col gap-5">
            <h2 className="text-base font-semibold text-white border-b border-white/10 pb-2">
              Xử lý đơn hàng
            </h2>

            <div className="flex flex-col gap-1">
              <span className="text-xs text-zinc-500">Trạng thái hiện tại</span>
              <div className="mt-1">
                <OrderStatusBadge status={currentStatus} />
              </div>
            </div>

            {/* Transition Dropdown */}
            <div className="flex flex-col gap-2">
              <span className="text-xs text-zinc-500">Cập nhật trạng thái mới</span>
              {hasNextStates ? (
                <Select
                  value=""
                  onValueChange={handleStatusChangeClick}
                >
                  <SelectTrigger className="w-full bg-white/5 border-white/10 text-white h-10 rounded-lg">
                    <SelectValue placeholder="Chọn trạng thái tiếp theo..." />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-white/10 text-white">
                    {validNextStates.map((statusVal) => {
                      const cfg = STATUS_CONFIG[statusVal];
                      return (
                        <SelectItem
                          key={statusVal}
                          value={statusVal}
                          className="hover:bg-white/5 focus:bg-white/5 cursor-pointer"
                        >
                          <span className="flex items-center gap-2">
                            <cfg.Icon className="h-4 w-4 shrink-0" />
                            {cfg.label}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              ) : (
                <div className="rounded-lg bg-zinc-900 border border-white/5 p-3 text-center text-xs text-zinc-500">
                  {currentStatus === "DELIVERED"
                    ? "Đơn hàng đã được giao thành công. Không thể thay đổi trạng thái."
                    : "Đơn hàng đã bị hủy. Không thể thay đổi trạng thái."}
                </div>
              )}
            </div>

            {/* Quick transition matrix helper visualization */}
            {hasNextStates && (
              <div className="mt-2 text-xs text-zinc-400 bg-white/[0.02] border border-white/5 rounded-lg p-3">
                <p className="font-semibold text-white mb-2">Quy trình chuyển đổi:</p>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] bg-amber-400/10 text-amber-400 px-1 py-0.5 rounded border border-amber-400/20">PENDING</span>
                    <span>&rarr;</span>
                    <span className="text-[10px] text-zinc-400">CONFIRMED, CANCELLED</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] bg-[#0C5CAB]/10 text-[#0C5CAB] px-1 py-0.5 rounded border border-[#0C5CAB]/20">CONFIRMED</span>
                    <span>&rarr;</span>
                    <span className="text-[10px] text-zinc-400">SHIPPING, CANCELLED</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] bg-violet-400/10 text-violet-400 px-1 py-0.5 rounded border border-violet-400/20">SHIPPING</span>
                    <span>&rarr;</span>
                    <span className="text-[10px] text-zinc-400">DELIVERED</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Payment & General Details */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-5 md:p-6 flex flex-col gap-4">
            <h2 className="text-base font-semibold text-white border-b border-white/10 pb-2 flex items-center gap-2">
              <Banknote className="h-5 w-5 text-primary" />
              Thông tin thanh toán
            </h2>
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Phương thức</span>
                <span className="text-zinc-300 font-medium">{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Trạng thái thanh toán</span>
                <span className="text-zinc-300 font-medium">
                  {order.paymentStatus || "Chờ thanh toán"}
                </span>
              </div>
              <Separator className="bg-white/10 my-1" />
              <div className="flex justify-between">
                <span className="text-zinc-500">Tổng hóa đơn</span>
                <span className="text-white font-semibold font-mono">
                  {formatCurrency(order.totalAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-zinc-950 border-white/10 text-white max-w-md rounded-xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Xác nhận thay đổi trạng thái
            </DialogTitle>
            <DialogDescription className="text-sm text-zinc-400 mt-2">
              Bạn có chắc chắn muốn thay đổi trạng thái của đơn hàng từ{" "}
              <span className="text-white font-semibold">
                {STATUS_CONFIG[currentStatus]?.label}
              </span>{" "}
              thành{" "}
              <span className="text-primary font-bold">
                {selectedStatus ? STATUS_CONFIG[selectedStatus]?.label : ""}
              </span>
              ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex flex-row gap-2 justify-end">
            <Button
              variant="ghost"
              onClick={() => {
                setDialogOpen(false);
                setSelectedStatus("");
              }}
              className="border border-white/10 hover:bg-white/5 text-zinc-300 hover:text-white rounded-lg cursor-pointer h-9 px-4 text-sm"
              disabled={updateStatusMutation.isPending}
            >
              Hủy
            </Button>
            <Button
              onClick={confirmStatusUpdate}
              className="bg-primary hover:bg-secondary text-white rounded-lg cursor-pointer h-9 px-4 text-sm flex items-center gap-1.5"
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
"
