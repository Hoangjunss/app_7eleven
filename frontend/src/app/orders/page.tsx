"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useMyOrders } from "@/hooks/useMyOrders";
import { OrderStatus } from "@/services/orderService";
import OrderStatusBadge from "@/components/order/OrderStatusBadge";
import { formatCurrency } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { ShoppingBag, Package, Eye, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "PENDING", label: "Chờ xác nhận" },
  { value: "CONFIRMED", label: "Đã xác nhận" },
  { value: "SHIPPING", label: "Đang giao hàng" },
  { value: "DELIVERED", label: "Đã giao hàng" },
  { value: "CANCELLED", label: "Đã hủy" },
];

const PAGE_SIZE = 10;

export default function MyOrdersPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Route guard
  useEffect(() => {
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để xem lịch sử đơn hàng.");
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  const { data, isLoading, isError, refetch } = useMyOrders({
    page,
    size: PAGE_SIZE,
    status: statusFilter !== "all" ? (statusFilter as OrderStatus) : undefined,
    sortBy: "createdAt",
    direction: "desc",
  });

  const orders = data?.data?.content ?? [];
  const totalPages = data?.data?.totalPages ?? 0;
  const totalElements = data?.data?.totalElements ?? 0;

  const handleStatusChange = (value: string | null) => {
    if (value) {
      setStatusFilter(value);
      setPage(0);
    }
  };

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));

  if (!isAuthenticated) return null;

  return (
    <div className="w-full max-w-5xl mx-auto py-6 text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            Lịch sử đơn hàng
          </h1>
          {!isLoading && (
            <p className="text-sm text-zinc-400 mt-1">
              {totalElements} đơn hàng
            </p>
          )}
        </div>

        {/* Status filter */}
        <Select value={statusFilter} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-52 bg-white/5 border-white/10 text-white h-9">
            <SelectValue placeholder="Lọc theo trạng thái" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-950 border-white/10 text-white">
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="hover:bg-white/5 focus:bg-white/5">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Error state */}
      {isError && (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500" />
          <p className="text-white font-medium">Không thể tải danh sách đơn hàng.</p>
          <Button
            onClick={() => refetch()}
            className="bg-primary hover:bg-secondary text-white rounded-lg cursor-pointer"
          >
            Thử lại
          </Button>
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 w-full bg-white/10 rounded" />
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-14 w-full bg-white/5 rounded" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && orders.length === 0 && (
        <div className="flex flex-col items-center gap-6 py-20 text-center">
          <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
            <ShoppingBag className="h-10 w-10 text-zinc-600 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white mb-1">Chưa có đơn hàng nào</h2>
            <p className="text-sm text-zinc-400">
              {statusFilter !== "all"
                ? "Không có đơn hàng nào ở trạng thái này."
                : "Bạn chưa đặt đơn hàng nào. Hãy bắt đầu mua sắm!"}
            </p>
          </div>
          <Link href="/">
            <Button className="bg-primary hover:bg-secondary text-white rounded-lg px-6 cursor-pointer font-semibold">
              Mua sắm ngay
            </Button>
          </Link>
        </div>
      )}

      {/* Orders Table */}
      {!isLoading && !isError && orders.length > 0 && (
        <>
          <div className="rounded-xl border border-white/10 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-zinc-400 font-medium">Mã đơn hàng</TableHead>
                  <TableHead className="text-zinc-400 font-medium hidden sm:table-cell">Ngày đặt</TableHead>
                  <TableHead className="text-zinc-400 font-medium text-right">Tổng tiền</TableHead>
                  <TableHead className="text-zinc-400 font-medium">Trạng thái</TableHead>
                  <TableHead className="text-zinc-400 font-medium text-center">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow
                    key={order.id}
                    className="border-white/5 hover:bg-white/[0.03] transition-colors"
                  >
                    <TableCell className="font-mono text-sm text-white font-medium">
                      {order.orderCode}
                    </TableCell>
                    <TableCell className="text-sm text-zinc-400 hidden sm:table-cell">
                      {formatDate(order.createdAt)}
                    </TableCell>
                    <TableCell className="text-sm text-white font-mono font-semibold text-right">
                      {formatCurrency(order.totalAmount)}
                    </TableCell>
                    <TableCell>
                      <OrderStatusBadge status={order.status} size="sm" />
                    </TableCell>
                    <TableCell className="text-center">
                      <Link href={`/orders/${order.id}`}>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-3 text-xs border border-white/10 hover:bg-white/5 text-zinc-300 hover:text-white cursor-pointer rounded-lg gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          Xem chi tiết
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      className={`cursor-pointer text-zinc-400 hover:text-white hover:bg-white/5 ${page === 0 ? "pointer-events-none opacity-40" : ""}`}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink
                        onClick={() => setPage(i)}
                        isActive={i === page}
                        className={`cursor-pointer ${i === page ? "bg-primary border-primary text-white" : "text-zinc-400 hover:text-white hover:bg-white/5 border-white/10"}`}
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                      className={`cursor-pointer text-zinc-400 hover:text-white hover:bg-white/5 ${page >= totalPages - 1 ? "pointer-events-none opacity-40" : ""}`}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}
    </div>
  );
}
