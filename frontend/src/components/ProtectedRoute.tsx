"use client";

/**
 * Route guard component to enforce authentication and role-based authorization.
 * SSR-safe, avoids hydration mismatch, and provides visual loading feedback.
 */
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, role } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);

  // Set mounted flag to true after hydration is complete
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để truy cập trang này.");
      router.push("/login");
      return;
    }

    if (allowedRoles && allowedRoles.length > 0) {
      const hasAccess = allowedRoles.includes(role || "");
      if (!hasAccess) {
        toast.error("Bạn không có quyền truy cập khu vực này.");
        router.push("/");
      }
    }
  }, [isAuthenticated, role, allowedRoles, router, isMounted]);

  // Loading spinner during hydration to prevent hydration mismatch flashes
  if (!isMounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  // If not authenticated, do not render children (wait for redirection)
  if (!isAuthenticated) {
    return null;
  }

  // If role does not match, do not render children (wait for redirection)
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role || "")) {
    return null;
  }

  return <>{children}</>;
}
