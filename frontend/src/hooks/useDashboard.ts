import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/services/dashboardService";

const STALE_TIME = 5 * 60 * 1000; // 5 minutes

export function useHotProducts() {
  return useQuery({
    queryKey: ["dashboard", "hotProducts"],
    queryFn: () => dashboardService.getHotProducts(),
    staleTime: STALE_TIME,
  });
}

export function useRecentOrders() {
  return useQuery({
    queryKey: ["dashboard", "recentOrders"],
    queryFn: () => dashboardService.getRecentOrders(),
    staleTime: STALE_TIME,
  });
}

export function useSuggestions() {
  return useQuery({
    queryKey: ["dashboard", "suggestions"],
    queryFn: () => dashboardService.getSuggestions(),
    staleTime: STALE_TIME,
  });
}
