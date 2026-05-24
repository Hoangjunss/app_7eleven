"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useHotProducts, useRecentOrders, useSuggestions } from "@/hooks/useDashboard";
import { Eye, ShoppingBag, TrendingUp, Package, Compass } from "lucide-react";

export default function UserDashboardPage() {
  const { data: hotProducts, isLoading: isHotLoading } = useHotProducts();
  const { data: recentOrders, isLoading: isOrdersLoading } = useRecentOrders();
  const { data: suggestions, isLoading: isSuggestionsLoading } = useSuggestions();

  const formatVND = (num: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(num || 0);
  };

  return (
    <div className="p-6 space-y-8 bg-[#09090b] text-white min-h-screen max-w-7xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-[#0C5CAB] to-blue-400 bg-clip-text text-transparent">
          Bảng Điều Khiển Của Bạn
        </h1>
        <p className="text-zinc-400 mt-1">Xem gợi ý sản phẩm, sản phẩm bán chạy và quản lý đơn hàng gần đây.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Section: Suggestions and Hot Products */}
        <div className="lg:col-span-2 space-y-8">
          {/* Section: Category Suggestions */}
          <div className="bg-[#09090b]/40 border border-white/10 rounded-xl p-5 backdrop-blur-md">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-primary">
              <Compass size={20} /> Gợi ý dành riêng cho bạn
            </h2>
            {isSuggestionsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="animate-pulse bg-white/5 h-24 rounded-lg" />
                ))}
              </div>
            ) : suggestions && suggestions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {suggestions.map((product) => (
                  <div
                    key={product.id}
                    className="flex gap-4 p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors group"
                  >
                    <div className="relative w-16 h-16 rounded bg-zinc-800 overflow-hidden flex-shrink-0">
                      {product.primaryImageUrl ? (
                        <Image
                          src={product.primaryImageUrl}
                          alt={product.name}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-600">
                          <Package size={20} />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col justify-between flex-grow min-w-0">
                      <div>
                        <h3 className="text-sm font-medium text-white truncate group-hover:text-primary transition-colors">
                          {product.name}
                        </h3>
                        <p className="text-xs text-zinc-400 mt-0.5 truncate">{product.categoryName}</p>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-emerald-400">{formatVND(product.price)}</span>
                        <Link
                          href={`/products/${product.id}`}
                          className="text-xs text-zinc-400 group-hover:text-white flex items-center gap-1 transition-colors"
                        >
                          Chi tiết <Eye size={12} />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-zinc-500 text-sm">Chưa có gợi ý nào cho bạn.</p>
            )}
          </div>

          {/* Section: Hot Products of Month */}
          <div className="bg-[#09090b]/40 border border-white/10 rounded-xl p-5 backdrop-blur-md">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-amber-400">
              <TrendingUp size={20} /> Sản phẩm Hot trong tháng
            </h2>
            {isHotLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-pulse bg-white/5 h-48 rounded-lg" />
                ))}
              </div>
            ) : hotProducts && hotProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {hotProducts.map((product) => (
                  <div
                    key={product.id}
                    className="p-3 bg-white/5 border border-white/10 rounded-lg hover:border-white/20 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative w-full aspect-video rounded bg-zinc-800 overflow-hidden mb-3">
                        {product.imageUrl ? (
                          <Image
                            src={product.imageUrl}
                            alt={product.name}
                            fill
                            sizes="(max-width: 768px) 100vw, 33vw"
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-600">
                            <Package size={24} />
                          </div>
                        )}
                        <span className="absolute top-2 right-2 bg-amber-500/90 text-black text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Đã bán {product.quantitySold}
                        </span>
                      </div>
                      <h3 className="text-sm font-medium text-white truncate">{product.name}</h3>
                    </div>
                    <div className="flex justify-between items-center mt-3 pt-2 border-t border-white/5">
                      <span className="text-sm font-semibold text-emerald-400">{formatVND(product.price)}</span>
                      <Link
                        href={`/products/${product.id}`}
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        Mua ngay
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-zinc-500 text-sm">Chưa có sản phẩm hot nào trong tháng.</p>
            )}
          </div>
        </div>

        {/* Right Section: Recent Orders */}
        <div className="bg-[#09090b]/40 border border-white/10 rounded-xl p-5 backdrop-blur-md h-fit">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-primary">
              <ShoppingBag size={20} /> Đơn hàng gần đây
            </h2>
            <Link href="/orders" className="text-xs text-zinc-400 hover:text-white hover:underline">
              Xem tất cả
            </Link>
          </div>

          {isOrdersLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-white/5 h-16 rounded-lg" />
              ))}
            </div>
          ) : recentOrders && recentOrders.length > 0 ? (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors flex justify-between items-center"
                >
                  <div>
                    <Link href={`/orders/${order.id}`} className="text-sm font-medium text-primary hover:underline">
                      {order.orderCode}
                    </Link>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                    </p>
                    <div className="mt-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        order.status === "DELIVERED" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                        order.status === "CANCELLED" ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" :
                        order.status === "SHIPPING" ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" :
                        order.status === "CONFIRMED" ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30" :
                        "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-emerald-400 block">{formatVND(order.totalAmount)}</span>
                    <Link
                      href={`/orders/${order.id}`}
                      className="text-xs text-zinc-400 hover:text-white mt-1 inline-block"
                    >
                      Chi tiết &rarr;
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-zinc-500 text-sm">Bạn chưa có đơn hàng nào.</p>
              <Link href="/" className="text-xs text-primary hover:underline mt-2 inline-block">
                Khám phá sản phẩm ngay
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
