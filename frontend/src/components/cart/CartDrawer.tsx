"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useCartStore } from "@/stores/cartStore";
import { useAuthStore } from "@/stores/authStore";
import { CART_QUERY_KEY } from "@/hooks/useCart";
import { formatCurrency } from "@/components/product/ProductCard";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Trash2, Minus, Plus, Inbox, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CartDrawer({ open, onOpenChange }: CartDrawerProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const { items, totalAmount, isLoading, removeItem, updateItem } = useCartStore();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });

  const handleRemove = async (productId: number, name: string) => {
    await removeItem(productId, invalidate);
    toast.success(`Đã xóa "${name}" khỏi giỏ hàng`);
  };

  const handleUpdateQty = async (productId: number, newQty: number) => {
    if (newQty < 1) return;
    await updateItem(productId, newQty, invalidate);
  };

  const handleGoToCart = () => {
    onOpenChange(false);
    router.push("/cart");
  };

  const handleCheckout = () => {
    onOpenChange(false);
    router.push("/cart");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md bg-[#09090b] border-l border-white/10 text-white flex flex-col p-0"
      >
        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-white/10">
          <SheetTitle className="flex items-center gap-2 text-white text-base font-semibold">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Giỏ hàng của bạn
            {items.length > 0 && (
              <span className="ml-auto text-xs font-normal text-zinc-400">
                {items.reduce((s, i) => s + i.quantity, 0)} sản phẩm
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        {/* Body */}
        {!isAuthenticated ? (
          <div className="flex flex-col items-center justify-center flex-1 gap-4 px-6 text-center">
            <ShoppingCart className="h-16 w-16 text-zinc-600" />
            <p className="text-zinc-400 text-sm">Đăng nhập để xem giỏ hàng</p>
            <Button
              onClick={() => { onOpenChange(false); router.push("/login"); }}
              className="bg-primary hover:bg-secondary text-white rounded-lg cursor-pointer"
            >
              Đăng nhập
            </Button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 gap-4 px-6 text-center">
            <Inbox className="h-16 w-16 text-zinc-600 animate-pulse" />
            <p className="text-zinc-400 text-sm">Giỏ hàng của bạn đang trống</p>
            <Button
              variant="ghost"
              onClick={() => { onOpenChange(false); router.push("/"); }}
              className="text-primary hover:text-primary hover:bg-primary/10 border border-primary/30 rounded-lg cursor-pointer"
            >
              Tiếp tục mua sắm
            </Button>
          </div>
        ) : (
          <ScrollArea className="flex-1 px-4 py-2">
            <div className="flex flex-col gap-3 py-2">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="flex gap-3 p-3 bg-white/5 border border-white/10 rounded-xl"
                >
                  {/* Thumbnail */}
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-zinc-800 shrink-0">
                    {item.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.thumbnailUrl}
                        alt={item.productName}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full text-zinc-600 text-xs">No img</div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex flex-col flex-1 gap-1 min-w-0">
                    <p className="text-sm font-medium text-white line-clamp-2 leading-snug">
                      {item.productName}
                    </p>
                    <p className="text-xs text-primary font-semibold font-mono">
                      {formatCurrency(item.price)}
                    </p>

                    {/* Qty controls */}
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center bg-zinc-900 border border-white/10 rounded-lg overflow-hidden h-7">
                        <button
                          disabled={item.quantity <= 1 || isLoading}
                          onClick={() => handleUpdateQty(item.productId, item.quantity - 1)}
                          className="px-2 h-full hover:bg-white/5 text-zinc-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="px-3 text-xs font-mono font-semibold min-w-[2rem] text-center">
                          {item.quantity}
                        </span>
                        <button
                          disabled={isLoading}
                          onClick={() => handleUpdateQty(item.productId, item.quantity + 1)}
                          className="px-2 h-full hover:bg-white/5 text-zinc-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      {isLoading && <Loader2 className="h-3 w-3 text-primary animate-spin" />}

                      <button
                        disabled={isLoading}
                        onClick={() => handleRemove(item.productId, item.productName)}
                        className="ml-auto h-7 w-7 flex items-center justify-center rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-400/10 disabled:opacity-30 cursor-pointer transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Footer – only show when logged in with items */}
        {isAuthenticated && items.length > 0 && (
          <SheetFooter className="px-6 py-4 border-t border-white/10 bg-zinc-950/60 flex flex-col gap-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-400">Tổng cộng:</span>
              <span className="text-lg font-bold text-white font-mono">
                {formatCurrency(totalAmount)}
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={handleGoToCart}
                className="flex-1 border border-white/10 hover:bg-white/5 text-white rounded-lg cursor-pointer h-9 text-sm"
              >
                Xem giỏ hàng
              </Button>
              <Button
                onClick={handleCheckout}
                className="flex-1 bg-primary hover:bg-secondary text-white rounded-lg cursor-pointer h-9 text-sm font-semibold"
              >
                Thanh toán
              </Button>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
