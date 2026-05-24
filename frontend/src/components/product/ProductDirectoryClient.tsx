"use client";

import React, { useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useProducts } from "@/hooks/useProducts";
import ProductGrid from "@/components/product/ProductGrid";
import FilterSidebar from "@/components/product/FilterSidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
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

  // Parse filters from URL params
  const search = searchParams.get("search") || "";
  const categoryId = searchParams.get("categoryId") || "";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const currentPage = parseInt(searchParams.get("page") || "0", 10);
  const size = 12;

  // React Query fetch
  const { data, isLoading, isError, error, refetch } = useProducts({
    page: currentPage,
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

  const updateParams = (newParams: Record<string, string | number | undefined>) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === undefined || value === "") {
        current.delete(key);
      } else {
        current.set(key, String(value));
      }
    });

    // Reset to page 0 if filters change (except when page itself is being changed)
    if (newParams.page === undefined) {
      current.delete("page");
    }

    const searchStr = current.toString();
    const query = searchStr ? `?${searchStr}` : "";
    router.push(`${pathname}${query}`);
  };

  const handleSearchChange = (val: string) => {
    updateParams({ search: val });
  };

  const handleCategoryChange = (val: string) => {
    updateParams({ categoryId: val });
  };

  const handlePriceChange = (min: string, max: string) => {
    updateParams({ minPrice: min, maxPrice: max });
  };

  const handlePageChange = (newPage: number) => {
    updateParams({ page: newPage });
  };

  const handleReset = () => {
    router.push(pathname);
  };

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
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 0) handlePageChange(currentPage - 1);
                      }}
                      className={currentPage === 0 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }).map((_, idx) => {
                    if (
                      idx === 0 ||
                      idx === totalPages - 1 ||
                      Math.abs(idx - currentPage) <= 1
                    ) {
                      return (
                        <PaginationItem key={idx}>
                          <PaginationLink
                            href="#"
                            isActive={idx === currentPage}
                            onClick={(e) => {
                              e.preventDefault();
                              handlePageChange(idx);
                            }}
                            className="cursor-pointer"
                          >
                            {idx + 1}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    } else if (
                      idx === 1 ||
                      idx === totalPages - 2
                    ) {
                      // Only render ellipsis once for gap
                      if (idx === 1 && currentPage > 2) {
                        return (
                          <PaginationItem key={idx}>
                            <span className="text-zinc-500 px-2 select-none">...</span>
                          </PaginationItem>
                        );
                      }
                      if (idx === totalPages - 2 && currentPage < totalPages - 3) {
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
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages - 1) handlePageChange(currentPage + 1);
                      }}
                      className={currentPage === totalPages - 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
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
