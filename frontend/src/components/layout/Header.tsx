"use client";

/**
 * Brand-compliant premium Header component.
 * Features sticky position, backdrop glass blur, user profile dropdown,
 * cart badge with item count, and role-based action triggers.
 */
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useCartStore } from "@/stores/cartStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { User, LogOut, ChevronDown, LayoutDashboard, ShoppingCart, Package } from "lucide-react";
import { toast } from "sonner";
import CartDrawer from "@/components/cart/CartDrawer";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout, role } = useAuthStore();
  const itemCount = useCartStore((s) => s.itemCount);
  const [isMounted, setIsMounted] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  const isAdminPage = pathname?.startsWith("/admin");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      router.push("/login");
    } catch {
      toast.error("Logout failed");
    }
  };

  // SSR Placeholder header to prevent hydration mismatches on client render
  if (!isMounted) {
    return (
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
    );
  }

  return (
    <>
      <CartDrawer open={cartDrawerOpen} onOpenChange={setCartDrawerOpen} />

      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#09090b]/80 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Left Side: Brand Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-black italic text-white transition-all duration-300 group-hover:scale-105">
              7E
            </div>
            <span className="text-xl font-bold tracking-tight text-white transition-colors duration-300 group-hover:text-primary">
              7-Eleven Shop
            </span>
          </Link>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {/* Cart Button – hidden on admin pages */}
            {!isAdminPage && (
              <button
                onClick={() => setCartDrawerOpen(true)}
                className="relative flex items-center justify-center h-9 w-9 rounded-lg text-white/80 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                aria-label="Giỏ hàng"
              >
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white animate-in zoom-in-75 duration-200">
                    {itemCount > 99 ? "99+" : itemCount}
                  </span>
                )}
              </button>
            )}

            {isAuthenticated && user ? (
              <div className="flex items-center gap-2">
                {role === "ADMIN" && (
                  <Link href="/admin/products">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hidden sm:flex items-center gap-1.5 text-white/80 hover:text-white hover:bg-white/5"
                    >
                      <LayoutDashboard className="h-4 w-4 text-primary" />
                      Admin Panel
                    </Button>
                  </Link>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        variant="ghost"
                        className="flex items-center gap-2 text-white/85 hover:text-white hover:bg-white/5 px-2 py-1.5 h-auto cursor-pointer"
                      />
                    }
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-primary font-semibold text-xs border border-primary/30">
                      {user.fullName.substring(0, 2).toUpperCase()}
                    </div>
                    <span className="hidden md:inline-block text-sm font-medium">
                      {user.fullName}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-56 border-white/10 bg-zinc-950 text-white"
                  >
                    <DropdownMenuGroup>
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">{user.fullName}</p>
                          <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                        </div>
                      </DropdownMenuLabel>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator className="bg-white/10" />
                    {!isAdminPage && (
                      <DropdownMenuItem
                        render={
                          <button
                            onClick={() => setCartDrawerOpen(true)}
                            className="flex w-full items-center gap-2"
                          />
                        }
                        className="hover:bg-white/5 cursor-pointer"
                      >
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                        Giỏ hàng
                        {itemCount > 0 && (
                          <span className="ml-auto text-xs font-bold text-primary">{itemCount}</span>
                        )}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      render={
                        <Link href="/orders" className="flex w-full items-center gap-2" />
                      }
                      className="hover:bg-white/5 cursor-pointer"
                    >
                      <Package className="h-4 w-4 text-muted-foreground" />
                      Lịch sử đơn hàng
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      render={
                        <Link href="/profile" className="flex w-full items-center gap-2" />
                      }
                      className="hover:bg-white/5 cursor-pointer"
                    >
                      <User className="h-4 w-4 text-muted-foreground" />
                      Profile Settings
                    </DropdownMenuItem>
                    {role === "ADMIN" && (
                      <DropdownMenuItem
                        render={
                          <Link href="/admin/products" className="flex w-full items-center gap-2" />
                        }
                        className="hover:bg-white/5 cursor-pointer sm:hidden"
                      >
                        <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                        Admin Dashboard
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="hover:bg-destructive/10 hover:text-destructive cursor-pointer text-red-400"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white/80 hover:text-white hover:bg-white/5"
                  >
                    Sign in
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="bg-primary hover:bg-secondary text-white font-medium">
                    Register
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
