"use client";

/**
 * Global App Layout Shell.
 * Integrates Header and AdminSidebar, checks route pathnames,
 * and maintains SSR compatibility with a safe mount check.
 */
import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Header from "./Header";
import AdminSidebar from "./AdminSidebar";
import { useAuthStore } from "@/stores/authStore";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const { role, isAuthenticated } = useAuthStore();

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
      <Header />
      <div className="flex-grow flex">
        {isAdminPage && isAuthenticated && role === "ADMIN" && <AdminSidebar />}
        <main className="flex-grow flex flex-col p-6 md:p-8 bg-zinc-950/20">
          {children}
        </main>
      </div>
    </div>
  );
}
