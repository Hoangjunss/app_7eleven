"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "@/stores/authStore";
import { useCartStore } from "@/stores/cartStore";
import { cartService } from "@/services/cartService";
import { useCreateOrder } from "@/hooks/useCreateOrder";
import { useQueryClient } from "@tanstack/react-query";
import { CART_QUERY_KEY } from "@/hooks/useCart";
import { formatCurrency } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  MapPin,
  Phone,
  User,
  FileText,
  Banknote,
  ShoppingBag,
  Loader2,
  ChevronLeft,
  Package,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const checkoutSchema = z.object({
  recipientName: z
    .string()
    .min(1, "Vui lòng điền đầy đủ thông tin: Họ và tên người nhận")
    .min(2, "Tên phải có ít nhất 2 ký tự")
    .max(255, "Tên tối đa 255 ký tự"),
  recipientPhone: z
    .string()
    .min(1, "Vui lòng điền đầy đủ thông tin: Số điện thoại")
    .regex(/^[0-9]{9,11}$/, "Số điện thoại không hợp lệ (9–11 chữ số)"),
  deliveryAddress: z
    .string()
    .min(1, "Vui lòng điền đầy đủ thông tin: Địa chỉ giao hàng")
    .min(10, "Địa chỉ phải có ít nhất 10 ký tự"),
  note: z.string().max(500, "Ghi chú tối đa 500 ký tự").optional(),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

// ─── Order Summary Component ──────────────────────────────────────────────────

function OrderSummary() {
  const { items, totalAmount } = useCartStore();
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6 flex flex-col gap-4 shadow-lg shadow-black/20 sticky top-24">
      <h2 className="text-base font-semibold text-white flex items-center gap-2">
        <Package className="h-4 w-4 text-primary" />
        Đơn hàng ({itemCount} sản phẩm)
      </h2>

      {/* Item list */}
      <div className="flex flex-col gap-3 max-h-72 overflow-y-auto pr-1">
        {items.map((item) => (
          <div key={item.productId} className="flex gap-3 items-start">
            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-zinc-900 border border-white/10 shrink-0">
              {item.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.thumbnailUrl}
                  alt={item.productName}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full text-zinc-700 text-xs">?</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-medium line-clamp-2 leading-snug">
                {item.productName}
              </p>
              <p className="text-xs text-zinc-400 mt-0.5">
                {item.quantity} × {formatCurrency(item.price)}
              </p>
            </div>
            <span className="text-sm font-semibold text-white shrink-0 font-mono">
              {formatCurrency(item.subtotal)}
            </span>
          </div>
        ))}
      </div>

      <Separator className="bg-white/10" />

      {/* Totals */}
      <div className="flex flex-col gap-2 text-sm">
        <div className="flex justify-between text-zinc-400">
          <span>Phí vận chuyển</span>
          <span className="text-emerald-400">Miễn phí</span>
        </div>
        <div className="flex justify-between font-semibold text-white text-base">
          <span>Tổng cộng</span>
          <span className="font-mono">{formatCurrency(totalAmount)}</span>
        </div>
      </div>

      {/* Payment method */}
      <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
        <Banknote className="h-4 w-4 text-emerald-400 shrink-0" />
        <div>
          <p className="text-xs font-semibold text-emerald-400">COD – Thanh toán khi nhận hàng</p>
          <p className="text-xs text-zinc-500 mt-0.5">Thanh toán tiền mặt khi shipper giao hàng</p>
        </div>
      </div>
    </div>
  );
}

// ─── Checkout Page ────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const { items, syncCart } = useCartStore();
  const mutation = useCreateOrder();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
  });

  // ── Route guards ──
  useEffect(() => {
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để thanh toán.");
      router.push("/login");
      return;
    }
    if (isAuthenticated && items.length === 0) {
      toast.error("Giỏ hàng đang trống. Vui lòng thêm sản phẩm.");
      router.push("/cart");
    }
  }, [isAuthenticated, items.length, router]);

  // ── Submit ──
  const onSubmit = async (data: CheckoutFormData) => {
    mutation.mutate(
      {
        recipientName: data.recipientName,
        recipientPhone: data.recipientPhone,
        deliveryAddress: data.deliveryAddress,
        note: data.note || undefined,
      },
      {
        onSuccess: async (response) => {
          const orderId = response.data.id;
          // Clear cart on server + sync client state
          try {
            await cartService.clearCart();
          } catch {
            // best-effort; cart will be empty on next fetch anyway
          }
          queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
          syncCart([], 0);
          toast.success("Đặt hàng thành công! 🎉");
          router.push(`/orders/${orderId}`);
        },
        onError: (error: unknown) => {
          const status = (error as { response?: { status?: number } })?.response?.status;
          if (status === 422) {
            toast.error("Một hoặc nhiều sản phẩm không đủ số lượng trong kho.");
          } else if (status === 400) {
            toast.error("Giỏ hàng trống. Vui lòng thêm sản phẩm trước.");
            router.push("/cart");
          } else if (status === 401) {
            toast.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
            router.push("/login");
          } else {
            toast.error("Đặt hàng thất bại. Vui lòng thử lại.");
          }
        },
      }
    );
  };

  const isPending = mutation.isPending;

  // Render nothing if redirecting
  if (!isAuthenticated || items.length === 0) {
    return (
      <div className="w-full max-w-5xl mx-auto py-16 flex justify-center">
        <Skeleton className="h-96 w-full bg-white/10 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto py-6 text-white">
      {/* Back link */}
      <Link
        href="/cart"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors mb-6"
      >
        <ChevronLeft className="h-4 w-4" />
        Quay lại giỏ hàng
      </Link>

      <h1 className="text-2xl font-bold text-white flex items-center gap-2 mb-8">
        <ShoppingBag className="h-6 w-6 text-primary" />
        Thanh toán
      </h1>

      {/* 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">

        {/* ── Left: Delivery Form ── */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="lg:col-span-3 flex flex-col gap-6"
        >
          {/* Section: Shipping Info */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 flex flex-col gap-5 shadow-lg shadow-black/20">
            <h2 className="text-base font-semibold text-white border-b border-white/10 pb-3">
              Thông tin giao hàng
            </h2>

            {/* Recipient Name */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="recipientName" className="text-sm text-zinc-300 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-zinc-500" />
                Họ và tên người nhận <span className="text-red-400">*</span>
              </Label>
              <Input
                id="recipientName"
                placeholder="Nguyễn Văn A"
                disabled={isPending}
                {...register("recipientName")}
                className="bg-zinc-950/40 border-white/10 text-white placeholder-zinc-600 rounded-lg h-10 focus-visible:ring-primary focus-visible:border-primary disabled:opacity-50"
              />
              {errors.recipientName && (
                <p className="text-xs text-red-400">{errors.recipientName.message}</p>
              )}
            </div>

            {/* Phone */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="recipientPhone" className="text-sm text-zinc-300 flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-zinc-500" />
                Số điện thoại <span className="text-red-400">*</span>
              </Label>
              <Input
                id="recipientPhone"
                type="tel"
                placeholder="0901234567"
                disabled={isPending}
                {...register("recipientPhone")}
                className="bg-zinc-950/40 border-white/10 text-white placeholder-zinc-600 rounded-lg h-10 focus-visible:ring-primary focus-visible:border-primary disabled:opacity-50"
              />
              {errors.recipientPhone && (
                <p className="text-xs text-red-400">{errors.recipientPhone.message}</p>
              )}
            </div>

            {/* Address */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="deliveryAddress" className="text-sm text-zinc-300 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-zinc-500" />
                Địa chỉ giao hàng <span className="text-red-400">*</span>
              </Label>
              <Textarea
                id="deliveryAddress"
                placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
                disabled={isPending}
                rows={3}
                {...register("deliveryAddress")}
                className="bg-zinc-950/40 border-white/10 text-white placeholder-zinc-600 rounded-lg focus-visible:ring-primary focus-visible:border-primary resize-none disabled:opacity-50"
              />
              {errors.deliveryAddress && (
                <p className="text-xs text-red-400">{errors.deliveryAddress.message}</p>
              )}
            </div>

            {/* Note */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="note" className="text-sm text-zinc-300 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-zinc-500" />
                Ghi chú
                <span className="text-zinc-600 text-xs font-normal">(không bắt buộc)</span>
              </Label>
              <Textarea
                id="note"
                placeholder="Ghi chú cho shipper: gọi trước khi giao, để trước cửa..."
                disabled={isPending}
                rows={2}
                {...register("note")}
                className="bg-zinc-950/40 border-white/10 text-white placeholder-zinc-600 rounded-lg focus-visible:ring-primary focus-visible:border-primary resize-none disabled:opacity-50"
              />
              {errors.note && (
                <p className="text-xs text-red-400">{errors.note.message}</p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isPending}
            className="w-full h-12 bg-primary hover:bg-secondary text-white font-semibold rounded-lg text-base cursor-pointer disabled:opacity-60 shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-all"
          >
            {isPending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Đang đặt hàng...
              </>
            ) : (
              <>
                <ShoppingBag className="h-5 w-5" />
                Đặt hàng ngay
              </>
            )}
          </Button>

          <p className="text-center text-xs text-zinc-500">
            Bằng cách đặt hàng, bạn đồng ý với{" "}
            <span className="text-primary cursor-pointer hover:underline">điều khoản dịch vụ</span>{" "}
            của chúng tôi.
          </p>
        </form>

        {/* ── Right: Order Summary ── */}
        <div className="lg:col-span-2">
          <OrderSummary />
        </div>
      </div>
    </div>
  );
}
