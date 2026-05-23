"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useCartStore } from "@/stores/cartStore";
import { useAuthStore } from "@/stores/authStore";
import { useCart, CART_QUERY_KEY } from "@/hooks/useCart";
import { formatCurrency } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Trash2,
  Minus,
  Plus,
  Inbox,
  ShoppingBag,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

// ─── CartItem Row Component ───────────────────────────────────────────────────

interface CartItemRowProps {
  item: {
    productId: number;
    productName: string;
    price: number;
    thumbnailUrl: string | null;
    quantity: number;
    subtotal: number;
  };
  onUpdate: (productId: number, qty: number) => void;
  onRemove: (productId: number, name: string) => void;
  disabled: boolean;
}

function CartItemRow({ item, onUpdate, onRemove, disabled }: CartItemRowProps) {
  const [localQty, setLocalQty] = useState(item.quantity);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep localQty in sync if store updates (e.g. after refetch)
  useEffect(() => {
    setLocalQty(item.quantity);
  }, [item.quantity]);

  const handleQtyChange = (newQty: number) => {
    if (newQty < 1) return;
    setLocalQty(newQty);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onUpdate(item.productId, newQty);
    }, 500);
  };

  return (
    <div className="flex gap-4 p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/[0.07] transition-colors">
      {/* Image */}
      <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden bg-zinc-900 border border-white/10 shrink-0">
        {item.thumbnailUrl ? (
          <Image
            src={item.thumbnailUrl}
            alt={item.productName}
            fill
            sizes="96px"
            className="object-cover"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-zinc-600 text-xs">
            No img
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1 min-w-0">
        <Link
          href={`/products/${item.productId}`}
          className="text-sm sm:text-base font-medium text-white hover:text-primary transition-colors line-clamp-2 leading-snug"
        >
          {item.productName}
        </Link>
        <p className="text-xs text-zinc-400 font-mono">
          Đơn giá: {formatCurrency(item.price)}
        </p>

        {/* Qty controls */}
        <div className="flex items-center gap-3 mt-2">
          <div className="flex items-center bg-zinc-950/60 border border-white/10 rounded-lg h-8 overflow-hidden">
            <button
              disabled={localQty <= 1 || disabled}
              onClick={() => handleQtyChange(localQty - 1)}
              className="px-2.5 h-full hover:bg-white/5 text-zinc-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="px-3 text-sm font-mono font-semibold min-w-[2.5rem] text-center">
              {localQty}
            </span>
            <button
              disabled={disabled}
              onClick={() => handleQtyChange(localQty + 1)}
              className="px-2.5 h-full hover:bg-white/5 text-zinc-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>

          <button
            disabled={disabled}
            onClick={() => onRemove(item.productId, item.productName)}
            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-red-400 disabled:opacity-30 cursor-pointer transition-colors ml-auto"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Xóa</span>
          </button>
        </div>
      </div>

      {/* Subtotal */}
      <div className="flex flex-col items-end justify-between shrink-0 pl-2">
        <span className="text-sm font-bold text-white font-mono whitespace-nowrap">
          {formatCurrency(item.subtotal)}
        </span>
      </div>
    </div>
  );
}

// ─── Cart Page ────────────────────────────────────────────────────────────────

export default function CartPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const { items, totalAmount, isLoading: cartMutating, updateItem, removeItem, clearCart } = useCartStore();
  const { isLoading: isFetching, isError, refetch } = useCart();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
  const isDisabled = cartMutating || isFetching;

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để xem giỏ hàng.");
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  const handleUpdate = async (productId: number, qty: number) => {
    await updateItem(productId, qty, invalidate);
  };

  const handleRemove = async (productId: number, name: string) => {
    await removeItem(productId, invalidate);
    toast.success(`Đã xóa "${name}" khỏi giỏ hàng`);
  };

  const handleClearCart = async () => {
    if (!confirm("Bạn có chắc muốn xóa toàn bộ giỏ hàng?")) return;
    await clearCart(invalidate);
    toast.success("Đã xóa toàn bộ giỏ hàng");
  };

  // ── Loading skeleton ──
  if (isFetching && items.length === 0) {
    return (
      <div className="w-full max-w-5xl mx-auto py-6 flex flex-col gap-4">
        <Skeleton className="h-8 w-48 bg-white/10" />
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4 p-4 bg-white/5 border border-white/10 rounded-xl">
                <Skeleton className="w-24 h-24 rounded-lg bg-white/10 shrink-0" />
                <div className="flex-1 flex flex-col gap-2">
                  <Skeleton className="h-5 w-3/4 bg-white/10" />
                  <Skeleton className="h-4 w-1/4 bg-white/10" />
                  <Skeleton className="h-8 w-32 mt-2 bg-white/10" />
                </div>
              </div>
            ))}
          </div>
          <Skeleton className="w-full lg:w-72 h-56 bg-white/10 rounded-xl" />
        </div>
      </div>
    );
  }

  // ── Error state ──
  if (isError) {
    return (
      <div className="w-full max-w-xl mx-auto py-16 flex flex-col items-center gap-6 text-center">
        <AlertTriangle className="h-16 w-16 text-yellow-500" />
        <p className="text-white font-medium">Không thể tải giỏ hàng. Vui lòng thử lại.</p>
        <Button
          onClick={() => refetch()}
          className="bg-primary hover:bg-secondary text-white rounded-lg cursor-pointer"
        >
          Thử lại
        </Button>
      </div>
    );
  }

  // ── Empty state ──
  if (!isFetching && items.length === 0) {
    return (
      <div className="w-full max-w-xl mx-auto py-20 flex flex-col items-center gap-6 text-center">
        <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
          <Inbox className="h-10 w-10 text-zinc-500 animate-pulse" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white mb-1">Giỏ hàng của bạn đang trống</h2>
          <p className="text-sm text-zinc-400">Hãy thêm sản phẩm để bắt đầu mua sắm!</p>
        </div>
        <Link href="/">
          <Button className="bg-primary hover:bg-secondary text-white rounded-lg px-6 cursor-pointer font-semibold">
            Tiếp tục mua sắm
          </Button>
        </Link>
      </div>
    );
  }

  const itemCount = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="w-full max-w-5xl mx-auto py-6 text-white">
      {/* Page Title */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-primary" />
            Giỏ hàng của bạn
          </h1>
          <p className="text-sm text-zinc-400 mt-1">{itemCount} sản phẩm</p>
        </div>
        {items.length > 0 && (
          <button
            disabled={isDisabled}
            onClick={handleClearCart}
            className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-red-400 disabled:opacity-30 cursor-pointer transition-colors"
          >
            {isDisabled ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Xóa tất cả
          </button>
        )}
      </div>

      {/* Main 2-column layout */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left: Item list */}
        <div className="flex-1 flex flex-col gap-3">
          {items.map((item) => (
            <CartItemRow
              key={item.productId}
              item={item}
              onUpdate={handleUpdate}
              onRemove={handleRemove}
              disabled={isDisabled}
            />
          ))}
        </div>

        {/* Right: Order Summary (sticky) */}
        <div className="w-full lg:w-72 shrink-0 lg:sticky lg:top-24">
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 flex flex-col gap-4 shadow-lg shadow-black/20">
            <h2 className="text-base font-semibold text-white">Tổng đơn hàng</h2>

            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between text-zinc-400">
                <span>Số lượng sản phẩm</span>
                <span>{itemCount}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Phí vận chuyển</span>
                <span className="text-emerald-400">Miễn phí</span>
              </div>
            </div>

            <Separator className="bg-white/10" />

            <div className="flex items-center justify-between">
              <span className="font-medium text-white">Tổng cộng</span>
              <span className="text-xl font-bold text-white font-mono">
                {formatCurrency(totalAmount)}
              </span>
            </div>

            <Button
              onClick={() => router.push("/checkout")}
              disabled={isDisabled || items.length === 0}
              className="w-full bg-primary hover:bg-secondary text-white rounded-lg h-11 font-semibold cursor-pointer disabled:opacity-50 mt-1"
            >
              Tiến hành thanh toán
            </Button>

            <Link href="/" className="w-full">
              <Button
                variant="ghost"
                className="w-full border border-white/10 hover:bg-white/5 text-white/70 hover:text-white rounded-lg h-9 text-sm cursor-pointer"
              >
                Tiếp tục mua sắm
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
