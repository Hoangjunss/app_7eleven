"use client";

import React, { useState, useEffect } from "react";
import { useCategories } from "@/hooks/useCategories";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Search, RotateCcw, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FilterSidebarProps {
  search: string;
  onSearchChange: (val: string) => void;
  categoryId: string;
  onCategoryChange: (val: string) => void;
  minPrice: string;
  maxPrice: string;
  onPriceChange: (min: string, max: string) => void;
  onReset: () => void;
}

export default function FilterSidebar({
  search,
  onSearchChange,
  categoryId,
  onCategoryChange,
  minPrice,
  maxPrice,
  onPriceChange,
  onReset,
}: FilterSidebarProps) {
  const { data: categoriesResponse, isLoading: isLoadingCats } = useCategories();
  const categories = categoriesResponse?.data || [];

  // Local Search state for debounce
  const [localSearch, setLocalSearch] = useState(search);
  
  // Local Price states to avoid API call on every keystroke
  const [localMinPrice, setLocalMinPrice] = useState(minPrice);
  const [localMaxPrice, setLocalMaxPrice] = useState(maxPrice);

  // Sync with prop changes (e.g. on reset)
  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  useEffect(() => {
    setLocalMinPrice(minPrice);
    setLocalMaxPrice(maxPrice);
  }, [minPrice, maxPrice]);

  // Debounce search input (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      onSearchChange(localSearch);
    }, 300);
    return () => clearTimeout(handler);
  }, [localSearch, onSearchChange]);

  const handleApplyPrice = (e: React.FormEvent) => {
    e.preventDefault();
    onPriceChange(localMinPrice, localMaxPrice);
  };

  const handleResetClick = () => {
    setLocalSearch("");
    setLocalMinPrice("");
    setLocalMaxPrice("");
    onReset();
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 shadow-lg shadow-black/20 flex flex-col gap-6 text-white h-fit">
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-lg">Bộ lọc tìm kiếm</h2>
        </div>
        {(search || categoryId || minPrice || maxPrice) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetClick}
            className="text-zinc-400 hover:text-white hover:bg-white/5 flex items-center gap-1.5 h-8 px-2.5 rounded-lg cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="text-xs">Xóa bộ lọc</span>
          </Button>
        )}
      </div>

      {/* Search Input */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="search" className="text-sm font-medium text-zinc-300">
          Tìm kiếm
        </Label>
        <div className="relative">
          <Input
            id="search"
            type="text"
            placeholder="Tên sản phẩm..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full bg-zinc-950/30 border-white/10 text-white placeholder-zinc-550 pl-10 focus-visible:ring-primary focus-visible:border-primary rounded-lg h-9"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500 pointer-events-none" />
        </div>
      </div>

      {/* Category Dropdown */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="category" className="text-sm font-medium text-zinc-300">
          Danh mục
        </Label>
        <Select
          value={categoryId || "all"}
          onValueChange={(val) => onCategoryChange(val === "all" ? "" : val)}
        >
          <SelectTrigger className="w-full bg-zinc-950/30 border-white/10 text-white rounded-lg h-9 cursor-pointer">
            <SelectValue placeholder="Tất cả danh mục" />
          </SelectTrigger>
          <SelectContent className="bg-[#18181b] border-white/10 text-white rounded-lg shadow-xl">
            <SelectItem value="all" className="hover:bg-white/5 cursor-pointer">Tất cả danh mục</SelectItem>
            {isLoadingCats ? (
              <SelectItem value="loading" disabled>
                Đang tải danh mục...
              </SelectItem>
            ) : (
              categories.map((cat) => (
                <SelectItem
                  key={cat.id}
                  value={cat.id.toString()}
                  className="hover:bg-white/5 cursor-pointer"
                >
                  {cat.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Price Range Filter */}
      <form onSubmit={handleApplyPrice} className="flex flex-col gap-2">
        <Label className="text-sm font-medium text-zinc-300">Khoảng giá (đ)</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={localMinPrice}
            onChange={(e) => setLocalMinPrice(e.target.value)}
            className="bg-zinc-950/30 border-white/10 text-white placeholder-zinc-550 rounded-lg h-9 w-full text-sm"
          />
          <span className="text-zinc-500 text-sm">—</span>
          <Input
            type="number"
            placeholder="Max"
            value={localMaxPrice}
            onChange={(e) => setLocalMaxPrice(e.target.value)}
            className="bg-zinc-950/30 border-white/10 text-white placeholder-zinc-550 rounded-lg h-9 w-full text-sm"
          />
        </div>
        <Button
          type="submit"
          size="sm"
          className="mt-2 w-full bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 rounded-lg cursor-pointer h-9 text-xs font-semibold"
        >
          Áp dụng giá
        </Button>
      </form>
    </div>
  );
}
