import { useQuery } from "@tanstack/react-query";
import { orderService, GetAdminOrdersParams } from "@/services/orderService";
import { useAuthStore } from "@/stores/authStore";

export const ALL_ORDERS_KEY = "allOrders";

/**
 * Fetch all orders for admin dashboard with optional filters.
 * Only enabled when the current user has ADMIN role.
 */
export function useAllOrders(params?: GetAdminOrdersParams) {
  const { isAuthenticated, role } = useAuthStore();

  return useQuery({
    queryKey: [ALL_ORDERS_KEY, params],
    queryFn: () => orderService.getAllOrdersAdmin(params),
    enabled: isAuthenticated && role === "ADMIN",
    staleTime: 30 * 1000,
  });
}
