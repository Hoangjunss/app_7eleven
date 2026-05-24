"use client";

/**
 * Premium Admin Sidebar component.
 * Collates navigation links for system administration (Products, Categories, Orders)
 * with hover micro-animations and active routing states.
 */
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Package, FolderTree, ClipboardList, Users, LayoutDashboard } from "lucide-react";

export default function AdminSidebar({ className }: { className?: string }) {
  const pathname = usePathname();

  const menuItems = [
    {
      name: "Dashboard",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Products",
      href: "/admin/products",
      icon: Package,
    },
    {
      name: "Categories",
      href: "/admin/categories",
      icon: FolderTree,
    },
    {
      name: "Orders",
      href: "/admin/orders",
      icon: ClipboardList,
    },
    {
      name: "Users",
      href: "/admin/users",
      icon: Users,
    },
  ];

  return (
    <aside className={cn("w-64 shrink-0 border-r border-white/10 bg-[#09090b]/40 backdrop-blur-md sticky top-[69px] h-[calc(100vh-69px)] flex flex-col p-4 space-y-2 overflow-y-auto", className)}>
      <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Management Menu
      </div>
      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer",
                isActive
                  ? "bg-primary text-white shadow-md shadow-primary/20"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4",
                  isActive ? "text-white" : "text-zinc-500 group-hover:text-white"
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
