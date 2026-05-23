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
