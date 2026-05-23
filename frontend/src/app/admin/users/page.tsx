"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import {
  useAdminUsers,
  useUpdateUserRoles,
  useLockUser,
  useRestoreUser,
} from "@/hooks/useAdminUsers";
import { User } from "@/services/adminUserService";
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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Users,
  Search,
  Shield,
  Lock,
  Unlock,
  AlertTriangle,
  Check,
  UserCheck,
  UserX,
} from "lucide-react";
import { toast } from "sonner";

const PAGE_SIZE = 10;

export default function AdminUsersPage() {
  const router = useRouter();
  const { isAuthenticated, role, user } = useAuthStore();
  const currentUserEmail = user?.email;

  // Route guard – ADMIN only
  useEffect(() => {
    if (!isAuthenticated || role !== "ADMIN") {
      toast.error("Bạn không có quyền truy cập trang này.");
      router.push("/");
    }
  }, [isAuthenticated, role, router]);

  // States
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(0); // Reset page on search
    }, 400);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  const { data: userData, isLoading, isError, refetch } = useAdminUsers({
    page,
    size: PAGE_SIZE,
    search: debouncedSearch,
  });

  const users = userData?.data?.content ?? [];
  const totalPages = userData?.data?.totalPages ?? 0;
  const totalElements = userData?.data?.totalElements ?? 0;

  // Mutations
  const updateRolesMutation = useUpdateUserRoles();
  const lockUserMutation = useLockUser();
  const restoreUserMutation = useRestoreUser();

  // Dialog States
  const [isRolesOpen, setIsRolesOpen] = useState(false);
  const [isLockOpen, setIsLockOpen] = useState(false);
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Roles Dialog state
  const [rolesSelected, setRolesSelected] = useState<string[]>([]);

  const handleOpenRolesModal = (user: User) => {
    setSelectedUser(user);
    setRolesSelected(user.roles);
    setIsRolesOpen(true);
  };

  const handleToggleRoleSelection = (roleName: string) => {
    if (rolesSelected.includes(roleName)) {
      // Don't allow removing all roles
      if (rolesSelected.length === 1) {
        toast.warning("Người dùng phải có ít nhất một vai trò.");
        return;
      }
      setRolesSelected(rolesSelected.filter((r) => r !== roleName));
    } else {
      setRolesSelected([...rolesSelected, roleName]);
    }
  };

  const handleSaveRoles = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    // Prevent removing own admin role to avoid lockout
    if (
      selectedUser.email === currentUserEmail &&
      !rolesSelected.includes("ADMIN")
    ) {
      return toast.error("Bạn không thể tự gỡ quyền ADMIN của chính mình!");
    }

    const promise = updateRolesMutation.mutateAsync({
      id: selectedUser.id,
      roles: rolesSelected,
    });

    toast.promise(promise, {
      loading: "Đang cập nhật vai trò...",
      success: () => {
        setIsRolesOpen(false);
        setSelectedUser(null);
        return "Cập nhật vai trò người dùng thành công!";
      },
      error: "Đã xảy ra lỗi khi cập nhật vai trò.",
    });
  };

  const handleLockConfirm = () => {
    if (!selectedUser) return;

    if (selectedUser.email === currentUserEmail) {
      setIsLockOpen(false);
      return toast.error("Bạn không thể tự khóa tài khoản của chính mình!");
    }

    const promise = lockUserMutation.mutateAsync(selectedUser.id);

    toast.promise(promise, {
      loading: "Đang khóa tài khoản...",
      success: () => {
        setIsLockOpen(false);
        setSelectedUser(null);
        return "Khóa tài khoản người dùng thành công!";
      },
      error: "Không thể khóa tài khoản.",
    });
  };

  const handleRestoreConfirm = () => {
    if (!selectedUser) return;
    const promise = restoreUserMutation.mutateAsync(selectedUser.id);

    toast.promise(promise, {
      loading: "Đang mở khóa tài khoản...",
      success: () => {
        setIsRestoreOpen(false);
        setSelectedUser(null);
        return "Mở khóa tài khoản thành công!";
      },
      error: "Không thể mở khóa tài khoản.",
    });
  };

  const formatDate = (isoString: string) => {
    return new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "medium",
    }).format(new Date(isoString));
  };

  if (!isAuthenticated || role !== "ADMIN") return null;

  return (
    <div className="w-full max-w-7xl mx-auto py-6 text-white px-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          Quản lý thành viên
        </h1>
        {!isLoading && (
          <p className="text-sm text-zinc-400 mt-1">
            Tổng số: {totalElements} người dùng
          </p>
        )}
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm theo email hoặc tên..."
            className="pl-9 w-full bg-white/5 border-white/10 text-white placeholder-zinc-600 h-9 rounded-lg focus-visible:ring-primary"
          />
        </div>
      </div>

      {/* Error State */}
      {isError && (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 animate-bounce" />
          <p className="text-white font-medium">Không thể tải danh sách người dùng.</p>
          <Button
            onClick={() => refetch()}
            className="bg-primary hover:bg-secondary text-white rounded-lg cursor-pointer"
          >
            Thử lại
          </Button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 w-full bg-white/10 rounded" />
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-14 w-full bg-white/5 rounded" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && users.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <Users className="h-16 w-16 text-zinc-600 animate-pulse" />
          <p className="text-zinc-400">Không tìm thấy người dùng nào phù hợp.</p>
        </div>
      )}

      {/* Table */}
      {!isLoading && !isError && users.length > 0 && (
        <>
          <div className="rounded-xl border border-white/10 overflow-hidden overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent bg-white/[0.02]">
                  <TableHead className="text-zinc-400 font-medium whitespace-nowrap w-[80px]">ID</TableHead>
                  <TableHead className="text-zinc-400 font-medium whitespace-nowrap">Họ và tên</TableHead>
                  <TableHead className="text-zinc-400 font-medium whitespace-nowrap">Email</TableHead>
                  <TableHead className="text-zinc-400 font-medium whitespace-nowrap">Vai trò</TableHead>
                  <TableHead className="text-zinc-400 font-medium whitespace-nowrap">Trạng thái</TableHead>
                  <TableHead className="text-zinc-400 font-medium whitespace-nowrap hidden md:table-cell">Ngày đăng ký</TableHead>
                  <TableHead className="text-zinc-400 font-medium whitespace-nowrap text-center w-[120px]">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  const isLocked = !!user.deletedAt;
                  const isSelf = user.email === currentUserEmail;

                  return (
                    <TableRow
                      key={user.id}
                      className="border-white/5 hover:bg-white/[0.02] transition-colors"
                    >
                      <TableCell className="text-sm font-mono text-zinc-400 align-middle">
                        #{user.id}
                      </TableCell>
                      <TableCell className="text-sm font-semibold text-white align-middle whitespace-nowrap">
                        {user.fullName || <span className="text-zinc-500 italic">Chưa cập nhật</span>}
                        {isSelf && (
                          <span className="ml-2 text-[10px] bg-white/15 text-zinc-300 px-1.5 py-0.5 rounded-full font-normal">
                            Tôi
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-zinc-300 align-middle">
                        {user.email}
                      </TableCell>
                      <TableCell className="align-middle">
                        <div className="flex gap-1 flex-wrap">
                          {user.roles.map((r) => (
                            <span
                              key={r}
                              className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                r === "ADMIN"
                                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                  : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                              }`}
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="align-middle">
                        {isLocked ? (
                          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                            <UserX className="h-3 w-3" />
                            Bị khóa
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <UserCheck className="h-3 w-3" />
                            Hoạt động
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-zinc-400 align-middle hidden md:table-cell">
                        {formatDate(user.createdAt)}
                      </TableCell>
                      <TableCell className="text-center align-middle">
                        <div className="flex justify-center items-center gap-2">
                          {/* Change roles button */}
                          <Button
                            onClick={() => handleOpenRolesModal(user)}
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-zinc-300 hover:text-white hover:bg-white/5 rounded-lg border border-white/5"
                            title="Gán vai trò"
                          >
                            <Shield className="h-3.5 w-3.5" />
                          </Button>

                          {/* Lock / Unlock button */}
                          {isLocked ? (
                            <Button
                              onClick={() => {
                                setSelectedUser(user);
                                setIsRestoreOpen(true);
                              }}
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg border border-emerald-500/10"
                              title="Mở khóa tài khoản"
                            >
                              <Unlock className="h-3.5 w-3.5" />
                            </Button>
                          ) : (
                            <Button
                              onClick={() => {
                                setSelectedUser(user);
                                setIsLockOpen(true);
                              }}
                              disabled={isSelf}
                              size="sm"
                              variant="ghost"
                              className={`h-8 w-8 p-0 rounded-lg border ${
                                isSelf
                                  ? "text-zinc-600 border-zinc-800 cursor-not-allowed opacity-50"
                                  : "text-red-400 hover:text-red-300 hover:bg-red-500/10 border-red-500/10"
                              }`}
                              title={isSelf ? "Không thể khóa chính mình" : "Khóa tài khoản"}
                            >
                              <Lock className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      className={`cursor-pointer text-zinc-400 hover:text-white hover:bg-white/5 ${
                        page === 0 ? "pointer-events-none opacity-40" : ""
                      }`}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink
                        onClick={() => setPage(i)}
                        isActive={i === page}
                        className={`cursor-pointer ${
                          i === page
                            ? "bg-primary border-primary text-white"
                            : "text-zinc-400 hover:text-white hover:bg-white/5 border-white/10"
                        }`}
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                      className={`cursor-pointer text-zinc-400 hover:text-white hover:bg-white/5 ${
                        page >= totalPages - 1 ? "pointer-events-none opacity-40" : ""
                      }`}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}

      {/* Update Roles Dialog */}
      <Dialog open={isRolesOpen} onOpenChange={setIsRolesOpen}>
        <DialogContent className="bg-zinc-950 border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Cập nhật vai trò thành viên
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveRoles} className="space-y-4 py-2">
            <div className="text-sm text-zinc-400">
              Chỉnh sửa vai trò cho tài khoản:{" "}
              <span className="font-semibold text-white">{selectedUser?.email}</span>
            </div>

            <div className="space-y-3 pt-2">
              {["USER", "ADMIN"].map((roleName) => {
                const isSelected = rolesSelected.includes(roleName);
                return (
                  <div
                    key={roleName}
                    onClick={() => handleToggleRoleSelection(roleName)}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? "bg-primary/5 border-primary text-white"
                        : "bg-white/5 border-white/5 hover:border-white/10 text-zinc-400"
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm">{roleName}</span>
                      <span className="text-xs text-zinc-500 mt-0.5">
                        {roleName === "ADMIN"
                          ? "Quyền quản lý hệ thống, sản phẩm, danh mục, hóa đơn và thành viên"
                          : "Quyền mua sắm, quản lý giỏ hàng, đặt hàng và xem lịch sử mua sắm"}
                      </span>
                    </div>
                    <div
                      className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                        isSelected
                          ? "bg-primary border-primary text-white"
                          : "border-zinc-700"
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>

            <DialogFooter className="border-t border-white/10 pt-4 mt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsRolesOpen(false)}
                className="bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-lg h-9 px-4 cursor-pointer"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={updateRolesMutation.isPending}
                className="bg-primary hover:bg-secondary text-white rounded-lg h-9 px-5 cursor-pointer font-medium"
              >
                Lưu lại
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Lock Confirmation Dialog */}
      <Dialog open={isLockOpen} onOpenChange={setIsLockOpen}>
        <DialogContent className="bg-zinc-950 border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-red-400">
              <AlertTriangle className="h-5 w-5" />
              Xác nhận khóa tài khoản
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 text-zinc-300 text-sm">
            Bạn có chắc chắn muốn khóa tài khoản{" "}
            <span className="font-semibold text-white">“{selectedUser?.fullName || selectedUser?.email}”</span>? Người dùng này sẽ không thể đăng nhập hoặc thực hiện bất kỳ hành động nào trên hệ thống sau khi bị khóa.
          </div>
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsLockOpen(false)}
              className="bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-lg h-9 px-4 cursor-pointer"
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={handleLockConfirm}
              className="bg-red-600 hover:bg-red-500 text-white rounded-lg h-9 px-5 cursor-pointer font-medium"
            >
              Đồng ý khóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Confirmation Dialog */}
      <Dialog open={isRestoreOpen} onOpenChange={setIsRestoreOpen}>
        <DialogContent className="bg-zinc-950 border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-emerald-400">
              <UserCheck className="h-5 w-5" />
              Xác nhận mở khóa tài khoản
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 text-zinc-300 text-sm">
            Bạn có chắc chắn muốn mở khóa tài khoản{" "}
            <span className="font-semibold text-white">“{selectedUser?.fullName || selectedUser?.email}”</span>? Người dùng này sẽ có thể đăng nhập lại và thực hiện mua sắm bình thường.
          </div>
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsRestoreOpen(false)}
              className="bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-lg h-9 px-4 cursor-pointer"
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={handleRestoreConfirm}
              className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg h-9 px-5 cursor-pointer font-medium"
            >
              Mở khóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
