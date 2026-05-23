"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import {
  useAdminCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "@/hooks/useAdminCategories";
import { Category } from "@/services/productService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  FolderTree,
  Plus,
  Search,
  Edit,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminCategoriesPage() {
  const router = useRouter();
  const { isAuthenticated, role } = useAuthStore();

  // Route guard – ADMIN only
  useEffect(() => {
    if (!isAuthenticated || role !== "ADMIN") {
      toast.error("Bạn không có quyền truy cập trang này.");
      router.push("/");
    }
  }, [isAuthenticated, role, router]);

  // States
  const [searchName, setSearchName] = useState("");
  const { data: catData, isLoading, isError, refetch } = useAdminCategories();
  const categories = catData?.data ?? [];

  // Filtered categories client-side
  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchName.toLowerCase())
  );

  // Mutations
  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();
  const deleteCategoryMutation = useDeleteCategory();

  // Dialog States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");

  const resetForm = () => {
    setFormName("");
    setFormDescription("");
    setCurrentCategory(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleOpenEditModal = (category: Category) => {
    resetForm();
    setCurrentCategory(category);
    setFormName(category.name);
    setFormDescription(category.description || "");
    setIsFormOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim()) return toast.error("Tên danh mục không được trống");

    const categoryPayload = {
      name: formName.trim(),
      description: formDescription.trim(),
    };

    const isEdit = !!currentCategory;
    const promise = isEdit
      ? updateCategoryMutation.mutateAsync({
          id: currentCategory.id,
          category: categoryPayload,
        })
      : createCategoryMutation.mutateAsync(categoryPayload);

    toast.promise(promise, {
      loading: isEdit ? "Đang cập nhật..." : "Đang tạo danh mục...",
      success: () => {
        setIsFormOpen(false);
        resetForm();
        return isEdit ? "Cập nhật danh mục thành công!" : "Tạo danh mục thành công!";
      },
      error: "Đã xảy ra lỗi khi lưu danh mục.",
    });
  };

  const handleDeleteConfirm = () => {
    if (!currentCategory) return;
    const promise = deleteCategoryMutation.mutateAsync(currentCategory.id);

    toast.promise(promise, {
      loading: "Đang xóa danh mục...",
      success: () => {
        setIsDeleteOpen(false);
        setCurrentCategory(null);
        return "Xóa danh mục thành công!";
      },
      error: "Không thể xóa danh mục.",
    });
  };

  if (!isAuthenticated || role !== "ADMIN") return null;

  return (
    <div className="w-full max-w-7xl mx-auto py-6 text-white px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FolderTree className="h-6 w-6 text-primary" />
            Quản lý danh mục
          </h1>
          {!isLoading && (
            <p className="text-sm text-zinc-400 mt-1">{filteredCategories.length} danh mục</p>
          )}
        </div>
        <Button
          onClick={handleOpenAddModal}
          className="bg-primary hover:bg-secondary text-white rounded-lg cursor-pointer h-9 px-4 gap-1 self-start sm:self-auto font-medium"
        >
          <Plus className="h-4 w-4" />
          Thêm danh mục
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
          <Input
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            placeholder="Tìm kiếm theo tên danh mục..."
            className="pl-9 w-full bg-white/5 border-white/10 text-white placeholder-zinc-600 h-9 rounded-lg focus-visible:ring-primary"
          />
        </div>
      </div>

      {/* Error */}
      {isError && (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 animate-bounce" />
          <p className="text-white font-medium">Không thể tải danh sách danh mục.</p>
          <Button
            onClick={() => refetch()}
            className="bg-primary hover:bg-secondary text-white rounded-lg cursor-pointer"
          >
            Thử lại
          </Button>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 w-full bg-white/10 rounded" />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 w-full bg-white/5 rounded" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && !isError && filteredCategories.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <FolderTree className="h-16 w-16 text-zinc-600 animate-pulse" />
          <p className="text-zinc-400">Không tìm thấy danh mục nào.</p>
        </div>
      )}

      {/* Table */}
      {!isLoading && !isError && filteredCategories.length > 0 && (
        <div className="rounded-xl border border-white/10 overflow-hidden overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent bg-white/[0.02]">
                <TableHead className="text-zinc-400 font-medium whitespace-nowrap w-[80px]">ID</TableHead>
                <TableHead className="text-zinc-400 font-medium whitespace-nowrap">Tên danh mục</TableHead>
                <TableHead className="text-zinc-400 font-medium whitespace-nowrap">Mô tả</TableHead>
                <TableHead className="text-zinc-400 font-medium whitespace-nowrap text-center">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories.map((category) => (
                <TableRow
                  key={category.id}
                  className="border-white/5 hover:bg-white/[0.02] transition-colors"
                >
                  <TableCell className="text-sm font-mono text-zinc-400 align-middle">
                    #{category.id}
                  </TableCell>
                  <TableCell className="text-sm font-semibold text-white align-middle whitespace-nowrap">
                    {category.name}
                  </TableCell>
                  <TableCell className="text-sm text-zinc-400 align-middle max-w-[400px] truncate">
                    {category.description || <span className="text-zinc-600 italic">Không có mô tả</span>}
                  </TableCell>
                  <TableCell className="text-center align-middle">
                    <div className="flex justify-center items-center gap-2">
                      <Button
                        onClick={() => handleOpenEditModal(category)}
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-zinc-300 hover:text-white hover:bg-white/5 rounded-lg border border-white/5"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        onClick={() => {
                          setCurrentCategory(category);
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
      )}

      {/* Form Dialog Modal (Create / Edit) */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="bg-zinc-950 border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <FolderTree className="h-5 w-5 text-primary" />
              {currentCategory ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveCategory} className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-xs text-zinc-400 font-medium">Tên danh mục *</label>
              <Input
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ví dụ: Đồ ăn nhanh, Nước giải khát..."
                className="bg-white/5 border-white/10 text-white h-9 rounded-lg"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-zinc-400 font-medium">Mô tả danh mục</label>
              <textarea
                rows={3}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Nhập vài câu mô tả về danh mục này..."
                className="w-full bg-white/5 border border-white/10 text-white p-2 text-sm rounded-lg focus-visible:outline-none focus:border-primary transition-colors resize-none"
              />
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
                disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                className="bg-primary hover:bg-secondary text-white rounded-lg h-9 px-5 cursor-pointer font-medium"
              >
                Lưu lại
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
              Xác nhận xóa danh mục
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 text-zinc-300 text-sm">
            Bạn có chắc chắn muốn xóa danh mục{" "}
            <span className="font-semibold text-white">“{currentCategory?.name}”</span>? Xóa danh mục có thể ảnh hưởng đến việc hiển thị các sản phẩm thuộc danh mục này.
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
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-500 text-white rounded-lg h-9 px-5 cursor-pointer font-medium"
            >
              Đồng ý xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
