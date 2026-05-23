"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useProductDetail } from "@/hooks/useProductDetail";
import { formatCurrency } from "@/components/product/ProductCard";
import { useCartStore } from "@/stores/cartStore";
import { useAuthStore } from "@/stores/authStore";
import { CART_QUERY_KEY } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ShoppingCart, Check, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ProductDetailClientProps {
  id: string | number;
}

export default function ProductDetailClient({ id }: ProductDetailClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error, refetch } = useProductDetail(id);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  const { isAuthenticated } = useAuthStore();
  const { addItem, isLoading: cartLoading } = useCartStore();

  const product = data?.data;

  // Handle errors
  useEffect(() => {
    if (isError) {
      toast.error("Không thể tải thông tin chi tiết sản phẩm.");
      console.error(error);
    }
  }, [isError, error]);

  if (isLoading) {
    return (
      <div className="w-full max-w-5xl mx-auto py-8 flex flex-col gap-6">
        <Skeleton className="h-6 w-48 bg-white/10" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="flex flex-col gap-4">
            <Skeleton className="w-full aspect-square rounded-xl bg-white/10" />
            <div className="flex gap-2">
              <Skeleton className="w-20 h-20 rounded-lg bg-white/10" />
              <Skeleton className="w-20 h-20 rounded-lg bg-white/10" />
              <Skeleton className="w-20 h-20 rounded-lg bg-white/10" />
            </div>
          </div>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-24 bg-white/10" />
              <Skeleton className="h-10 w-3/4 bg-white/10" />
            </div>
            <Skeleton className="h-8 w-32 bg-white/10" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-full bg-white/10" />
              <Skeleton className="h-4 w-full bg-white/10" />
              <Skeleton className="h-4 w-2/3 bg-white/10" />
            </div>
            <Skeleton className="h-10 w-full bg-white/10" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="w-full max-w-xl mx-auto py-16 flex flex-col items-center justify-center text-center gap-6">
        <AlertTriangle className="h-16 w-16 text-yellow-500" />
        <div>
          <h2 className="text-xl font-semibold text-white mb-2">Không tìm thấy sản phẩm</h2>
          <p className="text-zinc-400 text-sm">
            Sản phẩm bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.
          </p>
        </div>
        <div className="flex gap-4">
          <Button
            onClick={() => refetch()}
            className="bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg px-4 py-2 cursor-pointer"
          >
            Thử lại
          </Button>
          <Link href="/">
            <Button className="bg-[#0C5CAB] hover:bg-[#0a4a8a] text-white rounded-lg px-4 py-2 cursor-pointer">
              Về trang chủ
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const images = product.images || [];
  const mainImage = activeImage || product.primaryImageUrl || (images[0]?.imageUrl) || "";
  const isOutOfStock = product.stockQuantity <= 0;

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.");
      router.push("/login");
      return;
    }
    try {
      await addItem(product!.id, quantity, () =>
        queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY })
      );
      toast.success(`Đã thêm "${product!.name}" vào giỏ hàng!`);
    } catch {
      toast.error("Không thể thêm sản phẩm. Vui lòng thử lại.");
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-4 flex flex-col gap-6 text-white">
      {/* Back Button & Breadcrumbs */}
      <div className="flex items-center gap-4 text-sm text-zinc-400">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
          Quay lại
        </button>
        <span>/</span>
        <Link href="/" className="hover:text-white transition-colors">
          Trang chủ
        </Link>
        <span>/</span>
        <span className="text-zinc-200 truncate max-w-xs">{product.name}</span>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Left Side: Images */}
        <div className="flex flex-col gap-4">
          <div className="relative w-full aspect-square bg-zinc-900 border border-white/10 rounded-xl overflow-hidden shadow-lg shadow-black/20">
            {mainImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mainImage}
                alt={product.name}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center w-full h-full text-zinc-550 text-sm font-medium">
                No Image
              </div>
            )}
            {isOutOfStock && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
                <span className="text-white text-lg font-bold uppercase tracking-wider px-4 py-2 border border-white rounded-lg">
                  Hết hàng
                </span>
              </div>
            )}
          </div>

          {/* Thumbnails list */}
          {images.length > 1 && (
            <div className="flex gap-2.5 overflow-x-auto pb-2">
              {images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImage(img.imageUrl)}
                  className={`relative w-20 h-20 rounded-lg overflow-hidden bg-zinc-900 border transition-all cursor-pointer ${
                    mainImage === img.imageUrl
                      ? "border-primary ring-2 ring-primary/50"
                      : "border-white/10 hover:border-white/30"
                  }`}
                >
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={img.imageUrl}
                    alt={`${product.name} thumbnail`}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Product Details */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-wider text-primary font-bold">
              {product.categoryName || "Chưa phân loại"}
            </span>
            <h1 className="text-2xl md:text-3xl font-semibold leading-tight text-white font-heading">
              {product.name}
            </h1>
          </div>

          {/* Pricing & Stock Status */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="text-2xl md:text-3xl font-bold text-white font-mono">
              {formatCurrency(product.price)}
            </div>
            <div>
              {isOutOfStock ? (
                <span className="bg-red-500/10 text-red-500 border border-red-500/20 text-xs px-2.5 py-1 rounded-md font-semibold flex items-center gap-1">
                  Hết hàng
                </span>
              ) : (
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs px-2.5 py-1 rounded-md font-semibold flex items-center gap-1">
                  <Check className="h-3.5 w-3.5" />
                  Còn hàng (Tồn: {product.stockQuantity})
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold text-zinc-300">Mô tả sản phẩm</h2>
            <p className="text-sm text-zinc-450 leading-relaxed whitespace-pre-line">
              {product.description || "Chưa có mô tả chi tiết cho sản phẩm này."}
            </p>
          </div>

          {/* Action section */}
          {!isOutOfStock && (
            <div className="flex flex-col gap-4 pt-4 border-t border-white/10">
              {/* Quantity selector */}
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-zinc-350">Số lượng:</span>
                <div className="flex items-center bg-zinc-950/40 border border-white/10 rounded-lg h-9 overflow-hidden">
                  <button
                    disabled={quantity <= 1}
                    onClick={() => setQuantity(quantity - 1)}
                    className="px-3 h-full hover:bg-white/5 active:bg-white/10 text-zinc-400 hover:text-white transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                  >
                    -
                  </button>
                  <span className="px-4 text-sm font-semibold font-mono w-12 text-center">
                    {quantity}
                  </span>
                  <button
                    disabled={quantity >= product.stockQuantity}
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3 h-full hover:bg-white/5 active:bg-white/10 text-zinc-400 hover:text-white transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Add to Cart and Buy Now buttons */}
              <div className="flex gap-4 mt-2">
                <Button
                  onClick={handleAddToCart}
                  disabled={cartLoading}
                  className="flex-1 bg-[#0C5CAB] hover:bg-[#0a4a8a] text-white rounded-lg py-6 font-semibold flex items-center justify-center gap-2 shadow-md shadow-black/25 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#0C5CAB] disabled:opacity-60"
                >
                  {cartLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <ShoppingCart className="h-5 w-5" />
                  )}
                  {cartLoading ? "Đang thêm..." : "Thêm vào giỏ hàng"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
