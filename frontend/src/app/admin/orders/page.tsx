"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useAllOrders } from "@/hooks/useAllOrders";
import { OrderStatus } from "@/services/orderService";
import OrderStatusBadge from "@/components/order/OrderStatusBadge";
import { formatCurrency } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { ClipboardList, Eye, AlertTriangle, Search } from "lucide-react";
import { toast } from "sonner";

const STATUS_OPTIONS = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "PENDING", label: "Chờ xác nhận" },
  { value: "CONFIRMED", label: "Đã xác nhận" },
  { value: "SHIPPING", label: "Đang giao hàng" },
  { value: "DELIVERED", label: "Đã giao hàng" },
  { value: "CANCELLED", label: "Đã hủy" },
];

const PAGE_SIZE = 15;

export default function AdminOrdersPage() {
  const router = useRouter();
  const { isAuthenticated, role } = useAuthStore();
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [userIdInput, setUserIdInput] = useState("");
  const [userIdFilter, setUserIdFilter] = useState<number | undefined>(undefined);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Route guard – ADMIN only
  useEffect(() => {
    if (!isAuthenticated || role !== "ADMIN") {
      toast.error("Bạn không có quyền truy cập trang này.");
      router.push("/");
    }
  }, [isAuthenticated, role, router]);

  // Debounce userId input
  const handleUserIdChange = (value: string) => {
    setUserIdInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const parsed = parseInt(value, 10);
      setUserIdFilter(!isNaN(parsed) && value.trim() !== "" ? parsed : undefined);
      setPage(0);
    }, 300);
  };

  const handleStatusChange = (value: string | null) => {
    if (value) {
      setStatusFilter(value);
      setPage(0);
    }
  };

  const { data, isLoading, isError, refetch } = useAllOrders({
    page,
    size: PAGE_SIZE,
    status: statusFilter !== "all" ? (statusFilter as OrderStatus) : undefined,
    userId: userIdFilter,
    sortBy: "createdAt",
    direction: sortDirection,
  });

  const orders = data?.data?.content ?? [];
  const totalPages = data?.data?.totalPages ?? 0;
  const totalElements = data?.data?.totalElements ?? 0;

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(iso));

  if (!isAuthenticated || role !== "ADMIN") return null;

  return (
    <div className="w-full max-w-7xl mx-auto py-6 text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-primary" />
            Quản lý đơn hàng
          </h1>
          {!isLoading && (
            <p className="text-sm text-zinc-400 mt-1">{totalElements} đơn hàng</p>
          )}
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
          <Input
            value={userIdInput}
            onChange={(e) => handleUserIdChange(e.target.value)}
            placeholder="Lọc theo User ID..."
            type="number"
            className="pl-9 w-52 bg-white/5 border-white/10 text-white placeholder-zinc-600 h-9 rounded-lg focus-visible:ring-primary"
          />
        </div>

        <Select value={statusFilter} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-52 bg-white/5 border-white/10 text-white h-9 rounded-lg">
            <SelectValue placeholder="Lọc theo trạng thái">
              {statusFilter === "all" ? "Tất cả trạng thái" : (STATUS_OPTIONS.find(o => o.value === statusFilter)?.label || "")}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-zinc-950 border-white/10 text-white">
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="hover:bg-white/5 focus:bg-white/5">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortDirection} onValueChange={(val) => setSortDirection(val as "asc" | "desc")}>
          <SelectTrigger className="w-52 bg-white/5 border-white/10 text-white h-9 rounded-lg">
            <SelectValue placeholder="Sắp xếp theo ngày">
              {sortDirection === "desc" ? "Mới nhất trước" : "Cũ nhất trước"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-zinc-950 border-white/10 text-white">
            <SelectItem value="desc" className="hover:bg-white/5 focus:bg-white/5">Mới nhất trước</SelectItem>
            <SelectItem value="asc" className="hover:bg-white/5 focus:bg-white/5">Cũ nhất trước</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Error */}
      {isError && (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500" />
          <p className="text-white font-medium">Không thể tải danh sách đơn hàng.</p>
          <Button onClick={() => refetch()} className="bg-primary hover:bg-secondary text-white rounded-lg cursor-pointer">
            Thử lại
          </Button>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 w-full bg-white/10 rounded" />
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-14 w-full bg-white/5 rounded" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && !isError && orders.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <ClipboardList className="h-16 w-16 text-zinc-600 animate-pulse" />
          <p className="text-zinc-400">Không có đơn hàng nào phù hợp với bộ lọc.</p>
        </div>
      )}

      {/* Table */}
      {!isLoading && !isError && orders.length > 0 && (
        <>
          <div className="rounded-xl border border-white/10 overflow-hidden overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-zinc-400 font-medium whitespace-nowrap">Mã đơn hàng</TableHead>
                  <TableHead className="text-zinc-400 font-medium whitespace-nowrap">User ID</TableHead>
                  <TableHead className="text-zinc-400 font-medium whitespace-nowrap">Người nhận</TableHead>
                  <TableHead className="text-zinc-400 font-medium whitespace-nowrap hidden lg:table-cell">Số điện thoại</TableHead>
                  <TableHead className="text-zinc-400 font-medium whitespace-nowrap text-right">Tổng tiền</TableHead>
                  <TableHead className="text-zinc-400 font-medium whitespace-nowrap">Trạng thái</TableHead>
                  <TableHead className="text-zinc-400 font-medium whitespace-nowrap hidden md:table-cell">Ngày đặt</TableHead>
                  <TableHead className="text-zinc-400 font-medium whitespace-nowrap text-center">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow
                    key={order.id}
                    className="border-white/5 hover:bg-white/[0.03] transition-colors"
                  >
                    <TableCell className="font-mono text-sm text-white font-medium whitespace-nowrap">
                      {order.orderCode}
                    </TableCell>
                    <TableCell className="text-sm text-zinc-400 font-mono">
                      #{order.userId}
                    </TableCell>
                    <TableCell className="text-sm text-zinc-300 whitespace-nowrap max-w-[160px] truncate">
                      {order.recipientName}
                    </TableCell>
                    <TableCell className="text-sm text-zinc-400 hidden lg:table-cell whitespace-nowrap">
                      {order.recipientPhone}
                    </TableCell>
                    <TableCell className="text-sm text-white font-mono font-semibold text-right whitespace-nowrap">
                      {formatCurrency(order.totalAmount)}
                    </TableCell>
                    <TableCell>
                      <OrderStatusBadge status={order.status} size="sm" />
                    </TableCell>
                    <TableCell className="text-sm text-zinc-500 hidden md:table-cell whitespace-nowrap">
                      {formatDate(order.createdAt)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Link href={`/admin/orders/${order.id}`}>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-3 text-xs border border-white/10 hover:bg-white/5 text-zinc-300 hover:text-white cursor-pointer rounded-lg gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          Xem
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
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    const pageNum = totalPages <= 7 ? i : Math.max(0, Math.min(page - 3, totalPages - 7)) + i;
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          onClick={() => setPage(pageNum)}
                          isActive={pageNum === page}
                          className={`cursor-pointer ${pageNum === page ? "bg-primary border-primary text-white" : "text-zinc-400 hover:text-white hover:bg-white/5 border-white/10"}`}
                        >
                          {pageNum + 1}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
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
