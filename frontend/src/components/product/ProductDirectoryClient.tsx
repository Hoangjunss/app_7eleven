"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useProducts } from "@/hooks/useProducts";
import ProductGrid from "@/components/product/ProductGrid";
import FilterSidebar from "@/components/product/FilterSidebar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export default function ProductDirectoryClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Lấy filter từ URL
  const search = searchParams.get("search") || "";
  const categoryId = searchParams.get("categoryId") || "";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";

  // State cho page (1-indexed), khởi tạo từ URL nếu có để hỗ trợ copy link/refresh
  const pageParam = searchParams.get("page");
  const parsedPage = pageParam ? parseInt(pageParam, 10) : 1;
  const initialPage = isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;
  const [page, setPage] = useState(initialPage);
  const size = 12;

  // Reset page về 1 khi filter thay đổi
  useEffect(() => {
    setPage(1);
  }, [search, categoryId, minPrice, maxPrice]);

  // Gọi API (backend 0-indexed)
  const { data, isLoading, isError, error, refetch } = useProducts({
    page: page - 1, // Guaranteed to be >= 0
    size,
    search,
    categoryId,
    minPrice,
    maxPrice,
  });

  // Handle error toasts
  useEffect(() => {
    if (isError) {
      toast.error("Không thể tải danh sách sản phẩm. Vui lòng thử lại!");
      console.error(error);
    }
  }, [isError, error]);

  // Đồng bộ URL với page (không gây reload, tránh race condition)
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (page === 1) {
      params.delete("page");
    } else {
      params.set("page", String(page));
    }
    const newUrl = `${pathname}?${params.toString()}`;
    router.replace(newUrl, { scroll: false });
  }, [page, pathname, searchParams, router]);

  // Handler chuyển trang
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Các hàm xử lý filter (giữ nguyên logic cập nhật URL)
  const updateParams = (newParams: Record<string, string | undefined>) => {
    const current = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === undefined || value === "") {
        current.delete(key);
      } else {
        current.set(key, value);
      }
    });
    // Không xóa page ở đây, page sẽ được reset qua useEffect khi filter thay đổi
    const searchStr = current.toString();
    const query = searchStr ? `?${searchStr}` : "";
    router.push(`${pathname}${query}`);
  };

  // Các handler cụ thể (giữ nguyên)
  const handleSearchChange = (val: string) => updateParams({ search: val });
  const handleCategoryChange = (val: string) => updateParams({ categoryId: val });
  const handlePriceChange = (min: string, max: string) => updateParams({ minPrice: min, maxPrice: max });
  const handleReset = () => router.push(pathname);

  const productsData = data?.data;
  const products = productsData?.content || [];
  const totalPages = productsData?.totalPages || 0;

  return (
    <div className="flex flex-col lg:flex-row gap-8 w-full max-w-7xl mx-auto py-4">
      {/* Sidebar filter */}
      <aside className="w-full lg:w-64 shrink-0">
        <FilterSidebar
          search={search}
          onSearchChange={handleSearchChange}
          categoryId={categoryId}
          onCategoryChange={handleCategoryChange}
          minPrice={minPrice}
          maxPrice={maxPrice}
          onPriceChange={handlePriceChange}
          onReset={handleReset}
        />
      </aside>

      {/* Main product area */}
      <div className="flex-1 flex flex-col gap-8">
        {isLoading ? (
          <ProductGrid products={[]} isLoading={true} limit={size} />
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 rounded-xl border border-red-500/20 bg-red-500/5 text-center">
            <p className="text-red-400 font-medium mb-4">Đã xảy ra lỗi khi tải danh sách sản phẩm.</p>
            <Button
              onClick={() => refetch()}
              className="bg-red-600 hover:bg-red-750 text-white rounded-lg px-4 py-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-red-600"
            >
              Thử lại
            </Button>
          </div>
        ) : (
          <>
            {/* Products grid */}
            <ProductGrid products={products} />

            {/* Pagination controls */}
            {totalPages > 1 && (
              <Pagination className="mt-4">
                <PaginationContent>
                  {/* Trang đầu */}
                  <PaginationItem>
                    <PaginationLink
                      onClick={() => {
                        if (page > 1) handlePageChange(1);
                      }}
                      className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      title="Trang đầu"
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </PaginationLink>
                  </PaginationItem>

                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => {
                        if (page > 1) handlePageChange(page - 1);
                      }}
                      className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const pageNum = idx + 1;
                    if (
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      Math.abs(pageNum - page) <= 1
                    ) {
                      return (
                        <PaginationItem key={idx}>
                          <PaginationLink
                            isActive={pageNum === page}
                            onClick={() => handlePageChange(pageNum)}
                            className="cursor-pointer"
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    } else if (
                      pageNum === 2 ||
                      pageNum === totalPages - 1
                    ) {
                      // Only render ellipsis once for gap
                      if (pageNum === 2 && page > 3) {
                        return (
                          <PaginationItem key={idx}>
                            <span className="text-zinc-500 px-2 select-none">...</span>
                          </PaginationItem>
                        );
                      }
                      if (pageNum === totalPages - 1 && page < totalPages - 2) {
                        return (
                          <PaginationItem key={idx}>
                            <span className="text-zinc-500 px-2 select-none">...</span>
                          </PaginationItem>
                        );
                      }
                    }
                    return null;
                  })}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => {
                        if (page < totalPages) handlePageChange(page + 1);
                      }}
                      className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>

                  {/* Trang cuối */}
                  <PaginationItem>
                    <PaginationLink
                      onClick={() => {
                        if (page < totalPages) handlePageChange(totalPages);
                      }}
                      className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      title="Trang cuối"
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </PaginationLink>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        )}
      </div>
    </div>
  );
}
