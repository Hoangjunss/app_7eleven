"use client";

/**
 * Global App Layout Shell.
 * Integrates Header, AdminSidebar, and CartSync.
 * Maintains SSR compatibility with a safe mount check.
 */
import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Header from "./Header";
import AdminSidebar from "./AdminSidebar";
import CartSync from "@/components/CartSync";
import { useAuthStore } from "@/stores/authStore";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const getAdminTitle = (path: string) => {
  if (path.includes("/dashboard")) return "Bảng điều khiển";
  if (path.includes("/products")) return "Sản phẩm";
  if (path.includes("/categories")) return "Danh mục";
  if (path.includes("/orders")) return "Đơn hàng";
  if (path.includes("/users")) return "Người dùng";
  return "Quản trị";
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const { role, isAuthenticated } = useAuthStore();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setSheetOpen(false);
  }, [pathname]);

  const isAuthPage = pathname === "/login" || pathname === "/register";
  const isAdminPage = pathname?.startsWith("/admin");

  // SSR initial render placeholder layout shell
  if (!isMounted) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#09090b]/80 py-4 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-black italic text-white">
                7E
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                7-Eleven Shop
              </span>
            </div>
          </div>
        </header>
        <div className="flex-grow flex">
          <main className="flex-1 p-6 md:p-8 bg-zinc-950/20">{children}</main>
        </div>
      </div>
    );
  }

  if (isAuthPage) {
    return <main className="flex-grow flex flex-col">{children}</main>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <CartSync />
      <Header />
      <div className="flex-grow flex flex-col lg:flex-row">
        {isAdminPage && isAuthenticated && role === "ADMIN" && (
          <>
            {/* Desktop Admin Sidebar */}
            <AdminSidebar className="hidden lg:flex" />

            {/* Mobile/Tablet Admin Sub-Header */}
            <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-[#09090b]/80 border-b border-white/10 backdrop-blur-md sticky top-[69px] z-30 w-full">
              <div className="flex items-center gap-2">
                <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                  <SheetTrigger render={
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/5 cursor-pointer rounded-lg">
                      <Menu className="h-5 w-5" />
                    </Button>
                  } />
                  <SheetContent side="left" className="bg-[#09090b] border-r border-white/10 text-white w-64 p-0">
                    <div className="py-4 border-b border-white/10 px-6 flex justify-between items-center bg-[#09090b]/80">
                      <span className="font-bold text-primary italic">7-Eleven Admin</span>
                    </div>
                    <AdminSidebar className="w-full border-r-0 bg-transparent min-h-0 min-w-0" />
                  </SheetContent>
                </Sheet>
                <span className="text-sm font-semibold text-zinc-300">
                  Admin / {getAdminTitle(pathname)}
                </span>
              </div>
            </div>
          </>
        )}
        <main className="flex-grow flex flex-col p-4 sm:p-6 md:p-8 bg-zinc-950/20">
          {children}
        </main>
      </div>
    </div>
  );
}
