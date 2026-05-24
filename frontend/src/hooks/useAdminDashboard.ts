import { useQuery } from "@tanstack/react-query";
import { adminDashboardService } from "@/services/adminDashboardService";

const STALE_TIME = 5 * 60 * 1000; // 5 minutes

export function useDashboardKpi(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["adminDashboard", "kpi", startDate, endDate],
    queryFn: () => adminDashboardService.getKpi(startDate, endDate),
    staleTime: STALE_TIME,
  });
}

export function useDashboardRevenue(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["adminDashboard", "revenue", startDate, endDate],
    queryFn: () => adminDashboardService.getRevenueChart(startDate, endDate),
    staleTime: STALE_TIME,
  });
}

export function useDashboardTopProducts(startDate: string, endDate: string, limit = 5) {
  return useQuery({
    queryKey: ["adminDashboard", "topProducts", startDate, endDate, limit],
    queryFn: () => adminDashboardService.getTopProducts(startDate, endDate, limit),
    staleTime: STALE_TIME,
  });
}

export function useDashboardRecentOrders(limit = 5) {
  return useQuery({
    queryKey: ["adminDashboard", "recentOrders", limit],
    queryFn: () => adminDashboardService.getRecentOrders(limit),
    staleTime: STALE_TIME,
  });
}

export function useDashboardRevenueStats(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["adminDashboard", "revenueStats", startDate, endDate],
    queryFn: () => adminDashboardService.getRevenueStats(startDate, endDate),
    staleTime: STALE_TIME,
  });
}

export function useDashboardOrderStats(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["adminDashboard", "orderStats", startDate, endDate],
    queryFn: () => adminDashboardService.getOrderStats(startDate, endDate),
    staleTime: STALE_TIME,
  });
}

export function useDashboardLowStock() {
  return useQuery({
    queryKey: ["adminDashboard", "lowStock"],
    queryFn: () => adminDashboardService.getLowStockProducts(),
    staleTime: STALE_TIME,
  });
}

export function useDashboardNoOrders() {
  return useQuery({
    queryKey: ["adminDashboard", "noOrders"],
    queryFn: () => adminDashboardService.getNoOrderProducts(),
    staleTime: STALE_TIME,
  });
}

export function useDashboardUserStats(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["adminDashboard", "userStats", startDate, endDate],
    queryFn: () => adminDashboardService.getUserStats(startDate, endDate),
    staleTime: STALE_TIME,
  });
}

export function useDashboardCategoryRevenue(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["adminDashboard", "categoryRevenue", startDate, endDate],
    queryFn: () => adminDashboardService.getCategoryRevenue(startDate, endDate),
    staleTime: STALE_TIME,
  });
}
