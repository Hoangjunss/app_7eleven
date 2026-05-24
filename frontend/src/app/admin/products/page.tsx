"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useCategories } from "@/hooks/useCategories";
import {
  useAdminProducts,
  useAdminProductDetail,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useUploadProductImages,
} from "@/hooks/useAdminProducts";
import { Product } from "@/services/productService";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  AlertTriangle,
  Upload,
  Image as ImageIcon,
  Check,
  X,
  Loader2,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { toast } from "sonner";

const PAGE_SIZE = 10;

export default function AdminProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, role } = useAuthStore();

  const highlightId = searchParams.get("highlight");
  const { data: highlightedProductData } = useAdminProductDetail(highlightId ? parseInt(highlightId, 10) : "");

  // Route guard – ADMIN only
  useEffect(() => {
    if (!isAuthenticated || role !== "ADMIN") {
      toast.error("Bạn không có quyền truy cập trang này.");
      router.push("/");
    }
  }, [isAuthenticated, role, router]);

  // States for filters
  const [page, setPage] = useState(0);
  const [searchName, setSearchName] = useState("");
  const [debouncedName, setDebouncedName] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [minPriceInput, setMinPriceInput] = useState("");
  const [maxPriceInput, setMaxPriceInput] = useState("");
  const [debouncedMinPrice, setDebouncedMinPrice] = useState("");
  const [debouncedMaxPrice, setDebouncedMaxPrice] = useState("");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const minPriceDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxPriceDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search input
  const handleSearchChange = (value: string) => {
    setSearchName(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedName(value);
      setPage(0);
    }, 400);
  };

  const handleCategoryChange = (value: string | null) => {
    if (value) {
      setCategoryFilter(value);
      setPage(0);
    }
  };

  const handleMinPriceChange = (value: string) => {
    setMinPriceInput(value);
    if (minPriceDebounceRef.current) clearTimeout(minPriceDebounceRef.current);
    minPriceDebounceRef.current = setTimeout(() => {
      setDebouncedMinPrice(value);
      setPage(0);
    }, 400);
  };

  const handleMaxPriceChange = (value: string) => {
    setMaxPriceInput(value);
    if (maxPriceDebounceRef.current) clearTimeout(maxPriceDebounceRef.current);
    maxPriceDebounceRef.current = setTimeout(() => {
      setDebouncedMaxPrice(value);
      setPage(0);
    }, 400);
  };

  // Queries
  const { data: catData } = useCategories();
  const categories = catData?.data ?? [];

  const { data: prodData, isLoading, isError, refetch } = useAdminProducts({
    page,
    size: PAGE_SIZE,
    name: debouncedName || undefined,
    categoryId: categoryFilter !== "all" ? categoryFilter : undefined,
    minPrice: debouncedMinPrice || undefined,
    maxPrice: debouncedMaxPrice || undefined,
  });

  const products = prodData?.data?.content ?? [];
  const totalPages = prodData?.data?.totalPages ?? 0;
  const totalElements = prodData?.data?.totalElements ?? 0;

  // Mutations
  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();
  const deleteProductMutation = useDeleteProduct();
  const uploadImagesMutation = useUploadProductImages();

  // Dialog States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);

  // Form Fields State
  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formStock, setFormStock] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formDescription, setFormDescription] = useState("");

  // Form Image Selection State
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [primaryImageIdx, setPrimaryImageIdx] = useState(0);

  const resetForm = () => {
    setFormName("");
    setFormPrice("");
    setFormStock("");
    setFormCategory("");
    setFormDescription("");
    setSelectedFiles([]);
    // Revoke old object URLs to avoid memory leaks
    filePreviews.forEach((url) => URL.revokeObjectURL(url));
    setFilePreviews([]);
    setPrimaryImageIdx(0);
    setCurrentProduct(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    resetForm();
    setCurrentProduct(product);
    setFormName(product.name);
    setFormPrice(product.price.toString());
    setFormStock(product.stockQuantity.toString());
    setFormCategory(product.categoryId.toString());
    setFormDescription(product.description || "");
    setIsFormOpen(true);
  };

  useEffect(() => {
    if (highlightedProductData?.data) {
      handleOpenEditModal(highlightedProductData.data);
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [highlightedProductData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const newFiles = [...selectedFiles, ...filesArray];
      setSelectedFiles(newFiles);

      const newPreviews = filesArray.map((file) => URL.createObjectURL(file));
      setFilePreviews([...filePreviews, ...newPreviews]);
    }
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);

    const newPreviews = [...filePreviews];
    URL.revokeObjectURL(newPreviews[index]);
    newPreviews.splice(index, 1);
    setFilePreviews(newPreviews);

    if (primaryImageIdx === index) {
      setPrimaryImageIdx(0);
    } else if (primaryImageIdx > index) {
      setPrimaryImageIdx(primaryImageIdx - 1);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim()) return toast.error("Vui lòng điền đầy đủ thông tin: Tên sản phẩm");
    if (!formPrice.toString().trim()) return toast.error("Vui lòng điền đầy đủ thông tin: Giá sản phẩm");
    if (isNaN(Number(formPrice)) || Number(formPrice) < 0)
      return toast.error("Giá sản phẩm phải là số dương");
    if (!formStock.toString().trim()) return toast.error("Vui lòng điền đầy đủ thông tin: Số lượng kho");
    if (isNaN(Number(formStock)) || Number(formStock) < 0)
      return toast.error("Số lượng kho phải là số lớn hơn hoặc bằng 0");
    if (!formCategory) return toast.error("Vui lòng điền đầy đủ thông tin: Danh mục");

    const productPayload = {
      name: formName,
      price: Number(formPrice),
      stockQuantity: Number(formStock),
      categoryId: Number(formCategory),
      description: formDescription,
    };

    const isEdit = !!currentProduct;
    const promise = new Promise(async (resolve, reject) => {
      try {
        if (isEdit) {
          // 1. Update text details
          await updateProductMutation.mutateAsync({
            id: currentProduct!.id,
            product: productPayload,
          });

          // 2. If new images are selected, upload them
          if (selectedFiles.length > 0) {
            await uploadImagesMutation.mutateAsync({
              id: currentProduct!.id,
              images: selectedFiles,
              primaryImageIndex: primaryImageIdx,
            });
          }
          resolve("Cập nhật sản phẩm thành công!");
        } else {
          // Create product (with or without images)
          await createProductMutation.mutateAsync({
            product: productPayload,
            images: selectedFiles.length > 0 ? selectedFiles : undefined,
            primaryImageIndex: selectedFiles.length > 0 ? primaryImageIdx : undefined,
          });
          resolve("Thêm sản phẩm thành công!");
        }
        setIsFormOpen(false);
        resetForm();
      } catch (error) {
        reject(error);
      }
    });

    toast.promise(promise, {
      loading: isEdit ? "Đang cập nhật..." : "Đang tạo sản phẩm...",
      success: (msg) => `${msg}`,
      error: "Đã xảy ra lỗi khi lưu sản phẩm.",
    });
  };

  const handleDeleteConfirm = () => {
    if (!currentProduct) return;
    const promise = deleteProductMutation.mutateAsync(currentProduct.id);

    toast.promise(promise, {
      loading: "Đang xóa sản phẩm...",
      success: () => {
        setIsDeleteOpen(false);
        setCurrentProduct(null);
        return "Xóa sản phẩm thành công!";
      },
      error: "Không thể xóa sản phẩm.",
    });
  };

  if (!isAuthenticated || role !== "ADMIN") return null;

  return (
    <div className="w-full max-w-7xl mx-auto py-6 text-white px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            Quản lý sản phẩm
          </h1>
          {!isLoading && (
            <p className="text-sm text-zinc-400 mt-1">{totalElements} sản phẩm</p>
          )}
        </div>
        <Button
          onClick={handleOpenAddModal}
          className="bg-primary hover:bg-secondary text-white rounded-lg cursor-pointer h-9 px-4 gap-1 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Thêm sản phẩm
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-5 items-center">
        <div className="relative flex-grow max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
          <Input
            value={searchName}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Tìm kiếm theo tên sản phẩm..."
            className="pl-9 w-full bg-white/5 border-white/10 text-white placeholder-zinc-600 h-9 rounded-lg focus-visible:ring-primary"
          />
        </div>

        <Select value={categoryFilter} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-full md:w-52 bg-white/5 border-white/10 text-white h-9 rounded-lg">
            <SelectValue placeholder="Lọc theo danh mục">
              {categoryFilter === "all"
                ? "Tất cả danh mục"
                : (categories.find((cat) => cat.id.toString() === categoryFilter)?.name || "")}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-zinc-950 border-white/10 text-white">
            <SelectItem value="all">Tất cả danh mục</SelectItem>
            {categories.map((cat) => (
              <SelectItem
                key={cat.id}
                value={cat.id.toString()}
                className="hover:bg-white/5 focus:bg-white/5"
              >
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Input
            type="number"
            min="0"
            value={minPriceInput}
            onChange={(e) => handleMinPriceChange(e.target.value)}
            placeholder="Giá từ..."
            className="bg-white/5 border-white/10 text-white h-9 rounded-lg w-full md:w-28 font-mono text-xs"
          />
          <span className="text-zinc-500 text-xs shrink-0">—</span>
          <Input
            type="number"
            min="0"
            value={maxPriceInput}
            onChange={(e) => handleMaxPriceChange(e.target.value)}
            placeholder="Đến..."
            className="bg-white/5 border-white/10 text-white h-9 rounded-lg w-full md:w-28 font-mono text-xs"
          />
        </div>
      </div>

      {/* Error State */}
      {isError && (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 animate-bounce" />
          <p className="text-white font-medium">Không thể tải danh sách sản phẩm.</p>
          <Button
            onClick={() => refetch()}
            className="bg-primary hover:bg-secondary text-white rounded-lg cursor-pointer"
          >
            Thử lại
          </Button>
        </div>
      )}

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 w-full bg-white/10 rounded" />
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full bg-white/5 rounded" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && products.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <Package className="h-16 w-16 text-zinc-600 animate-pulse" />
          <p className="text-zinc-400">Không tìm thấy sản phẩm nào.</p>
        </div>
      )}

      {/* Data Table */}
      {!isLoading && !isError && products.length > 0 && (
        <>
          <div className="rounded-xl border border-white/10 overflow-hidden overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent bg-white/[0.02]">
                  <TableHead className="text-zinc-400 font-medium whitespace-nowrap w-[80px]">Ảnh</TableHead>
                  <TableHead className="text-zinc-400 font-medium whitespace-nowrap">Tên sản phẩm</TableHead>
                  <TableHead className="text-zinc-400 font-medium whitespace-nowrap">Danh mục</TableHead>
                  <TableHead className="text-zinc-400 font-medium whitespace-nowrap text-right">Giá bán</TableHead>
                  <TableHead className="text-zinc-400 font-medium whitespace-nowrap text-right">Tồn kho</TableHead>
                  <TableHead className="text-zinc-400 font-medium whitespace-nowrap text-center">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow
                    key={product.id}
                    className="border-white/5 hover:bg-white/[0.02] transition-colors"
                  >
                    <TableCell className="align-middle">
                      {product.primaryImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.primaryImageUrl}
                          alt={product.name}
                          className="h-10 w-10 object-cover rounded-lg border border-white/10 bg-white/5"
                        />
                      ) : (
                        <div className="h-10 w-10 flex items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-600">
                          <ImageIcon className="h-5 w-5" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm font-medium text-white max-w-[200px] truncate align-middle">
                      {product.name}
                    </TableCell>
                    <TableCell className="text-sm text-zinc-400 align-middle">
                      {product.categoryName}
                    </TableCell>
                    <TableCell className="text-sm text-white font-mono font-semibold text-right align-middle">
                      {formatCurrency(product.price)}
                    </TableCell>
                    <TableCell className="text-sm text-zinc-300 font-mono text-right align-middle">
                      {product.stockQuantity}
                    </TableCell>
                    <TableCell className="text-center align-middle">
                      <div className="flex justify-center items-center gap-2">
                        <Button
                          onClick={() => handleOpenEditModal(product)}
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-zinc-300 hover:text-white hover:bg-white/5 rounded-lg border border-white/5"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          onClick={() => {
                            setCurrentProduct(product);
                            setIsDeleteOpen(true);
                          }}
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg border border-red-500/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
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
                  {/* Trang đầu */}
                  <PaginationItem>
                    <PaginationLink
                      onClick={() => setPage(0)}
                      className={`cursor-pointer text-zinc-400 hover:text-white hover:bg-white/5 ${
                        page === 0 ? "pointer-events-none opacity-40" : ""
                      }`}
                      title="Trang đầu"
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </PaginationLink>
                  </PaginationItem>

                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      className={`cursor-pointer text-zinc-400 hover:text-white hover:bg-white/5 ${
                        page === 0 ? "pointer-events-none opacity-40" : ""
                      }`}
                    />
                  </PaginationItem>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    const pageNum =
                      totalPages <= 7 ? i : Math.max(0, Math.min(page - 3, totalPages - 7)) + i;
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          onClick={() => setPage(pageNum)}
                          isActive={pageNum === page}
                          className={`cursor-pointer ${
                            pageNum === page
                              ? "bg-primary border-primary text-white"
                              : "text-zinc-400 hover:text-white hover:bg-white/5 border-white/10"
                          }`}
                        >
                          {pageNum + 1}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                      className={`cursor-pointer text-zinc-400 hover:text-white hover:bg-white/5 ${
                        page >= totalPages - 1 ? "pointer-events-none opacity-40" : ""
                      }`}
                    />
                  </PaginationItem>

                  {/* Trang cuối */}
                  <PaginationItem>
                    <PaginationLink
                      onClick={() => setPage(totalPages - 1)}
                      className={`cursor-pointer text-zinc-400 hover:text-white hover:bg-white/5 ${
                        page >= totalPages - 1 ? "pointer-events-none opacity-40" : ""
                      }`}
                      title="Trang cuối"
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </PaginationLink>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="bg-zinc-950 border-white/10 text-white max-w-3xl md:max-w-4xl p-6 md:p-8 overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              {currentProduct ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
            </DialogTitle>
            {!currentProduct && (
              <p className="text-xs text-primary/95 mt-2 font-medium bg-primary/10 border border-primary/20 px-3 py-2 rounded-lg">
                💡 Bạn có thể thêm nhiều sản phẩm liên tiếp mà không cần tải lại trang.
              </p>
            )}
          </DialogHeader>

          <form onSubmit={handleSaveProduct} className="space-y-4 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column: Text Fields */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs text-zinc-400 font-medium">Tên sản phẩm *</label>
                  <Input
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Nhập tên sản phẩm..."
                    className="bg-white/5 border-white/10 text-white h-9 rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-zinc-400 font-medium">Giá bán (VND) *</label>
                    <Input
                      required
                      type="number"
                      min="0"
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                      placeholder="Giá..."
                      className="bg-white/5 border-white/10 text-white h-9 rounded-lg font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-zinc-400 font-medium">Số lượng kho *</label>
                    <Input
                      required
                      type="number"
                      min="0"
                      value={formStock}
                      onChange={(e) => setFormStock(e.target.value)}
                      placeholder="Kho..."
                      className="bg-white/5 border-white/10 text-white h-9 rounded-lg font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-zinc-400 font-medium">Danh mục *</label>
                  <Select value={formCategory} onValueChange={(val) => val && setFormCategory(val)}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white h-9 rounded-lg">
                      <SelectValue placeholder="Chọn danh mục">
                        {formCategory
                          ? (categories.find((cat) => cat.id.toString() === formCategory)?.name || "")
                          : "Chọn danh mục"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-950 border-white/10 text-white">
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-zinc-400 font-medium">Mô tả sản phẩm</label>
                  <textarea
                    rows={4}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Mô tả sản phẩm chi tiết..."
                    className="w-full bg-white/5 border border-white/10 text-white p-2 text-sm rounded-lg focus-visible:outline-none focus:border-primary transition-colors resize-none"
                  />
                </div>
              </div>

              {/* Right Column: Image Uploads */}
              <div className="space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <label className="text-xs text-zinc-400 font-medium">Hình ảnh sản phẩm</label>

                  {/* Drag-and-drop zone */}
                  <div className="relative border-2 border-dashed border-white/10 hover:border-primary/50 transition-colors rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer min-h-[140px] bg-white/[0.01]">
                    <Input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <Upload className="h-8 w-8 text-zinc-500 mb-2" />
                    <p className="text-xs text-zinc-300 font-medium">Nhấp hoặc kéo thả hình ảnh vào đây</p>
                    <p className="text-[10px] text-zinc-500 mt-1">Định dạng hỗ trợ: PNG, JPG, WEBP</p>
                  </div>

                  {/* Pre-existing images info in Edit mode */}
                  {currentProduct && currentProduct.images && currentProduct.images.length > 0 && (
                    <div className="space-y-1 mt-2">
                      <p className="text-[11px] text-zinc-400">Hình ảnh hiện có trên Cloudinary:</p>
                      <div className="flex flex-wrap gap-2">
                        {currentProduct.images.map((img) => (
                          <div
                            key={img.id}
                            className={`relative h-11 w-11 rounded-lg border overflow-hidden ${
                              img.isPrimary ? "border-primary" : "border-white/10"
                            }`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={img.imageUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                            {img.isPrimary && (
                              <div className="absolute bottom-0 inset-x-0 bg-primary text-[8px] text-center text-white py-0.5 font-bold">
                                CHÍNH
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Previews of newly selected files */}
                  {filePreviews.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[11px] text-zinc-400">Ảnh mới đã chọn để upload:</p>
                      <div className="grid grid-cols-4 gap-2">
                        {filePreviews.map((preview, index) => (
                          <div
                            key={index}
                            onClick={() => setPrimaryImageIdx(index)}
                            className={`group relative h-14 w-full rounded-lg border overflow-hidden cursor-pointer transition-all ${
                              primaryImageIdx === index
                                ? "border-primary ring-2 ring-primary/20 scale-[1.03]"
                                : "border-white/10 hover:border-white/20"
                            }`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={preview} alt="" className="h-full w-full object-cover" />

                            {/* Set primary overlay */}
                            {primaryImageIdx === index ? (
                              <div className="absolute top-1 right-1 h-3.5 w-3.5 rounded-full bg-primary flex items-center justify-center">
                                <Check className="h-2 w-2 text-white" />
                              </div>
                            ) : (
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <span className="text-[8px] text-white font-bold">Làm ảnh chính</span>
                              </div>
                            )}

                            {/* Remove button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveFile(index);
                              }}
                              className="absolute top-1 left-1 h-4 w-4 bg-red-600 hover:bg-red-500 rounded-full flex items-center justify-center shadow"
                            >
                              <X className="h-2.5 w-2.5 text-white" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-[11px] text-zinc-500 border border-white/5 bg-white/[0.01] p-2.5 rounded-lg mt-3">
                  💡 *Lưu ý:* Khi ở chế độ chỉnh sửa, bạn có thể chỉnh sửa các thông tin văn bản độc lập. Nếu chọn ảnh mới để tải lên, các ảnh mới này sẽ được thêm vào thư viện ảnh hiện có của sản phẩm.
                </div>
              </div>
            </div>

            <DialogFooter className="border-t border-white/10 pt-4 mt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsFormOpen(false)}
                className="bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-lg h-9 px-4 cursor-pointer"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={createProductMutation.isPending || updateProductMutation.isPending || uploadImagesMutation.isPending}
                className="bg-primary hover:bg-secondary text-white rounded-lg h-9 px-5 cursor-pointer font-medium flex items-center justify-center gap-1.5"
              >
                {createProductMutation.isPending || updateProductMutation.isPending || uploadImagesMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  "Lưu lại"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="bg-zinc-950 border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-red-400">
              <AlertTriangle className="h-5 w-5" />
              Xác nhận xóa sản phẩm
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 text-zinc-300 text-sm">
            Bạn có chắc chắn muốn xóa sản phẩm{" "}
            <span className="font-semibold text-white">“{currentProduct?.name}”</span>? Hành động này sẽ thực hiện soft-delete và sản phẩm không hiển thị công khai nữa.
          </div>
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsDeleteOpen(false)}
              className="bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-lg h-9 px-4 cursor-pointer"
            >
              Hủy
            </Button>
            <Button
              type="button"
              disabled={deleteProductMutation.isPending}
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-500 text-white rounded-lg h-9 px-5 cursor-pointer font-medium flex items-center justify-center gap-1.5"
            >
              {deleteProductMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang xóa...
                </>
              ) : (
                "Đồng ý xóa"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
