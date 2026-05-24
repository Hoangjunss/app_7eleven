"use client";

import React, { useEffect } from "react";
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

  // Parse filters from URL params (1-indexed for the user)
  const search = searchParams.get("search") || "";
  const categoryId = searchParams.get("categoryId") || "";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  
  const pageParam = searchParams.get("page");
  const parsedPage = pageParam ? parseInt(pageParam, 10) : 1;
  const currentPage = isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;
  const size = 12;

  // React Query fetch (uses 0-indexed for backend API)
  const { data, isLoading, isError, error, refetch } = useProducts({
    page: currentPage - 1, // Guaranteed to be >= 0
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

    // Reset to page 1 if filters change (except when page itself is being changed)
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
                  {/* Trang đầu */}
                  <PaginationItem>
                    <PaginationLink
                      onClick={() => {
                        if (currentPage > 1) handlePageChange(1);
                      }}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      title="Trang đầu"
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </PaginationLink>
                  </PaginationItem>

                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => {
                        if (currentPage > 1) handlePageChange(currentPage - 1);
                      }}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const pageNum = idx + 1;
                    if (
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      Math.abs(pageNum - currentPage) <= 1
                    ) {
                      return (
                        <PaginationItem key={idx}>
                          <PaginationLink
                            isActive={pageNum === currentPage}
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
                      if (pageNum === 2 && currentPage > 3) {
                        return (
                          <PaginationItem key={idx}>
                            <span className="text-zinc-500 px-2 select-none">...</span>
                          </PaginationItem>
                        );
                      }
                      if (pageNum === totalPages - 1 && currentPage < totalPages - 2) {
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
                        if (currentPage < totalPages) handlePageChange(currentPage + 1);
                      }}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>

                  {/* Trang cuối */}
                  <PaginationItem>
                    <PaginationLink
                      onClick={() => {
                        if (currentPage < totalPages) handlePageChange(totalPages);
                      }}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
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
