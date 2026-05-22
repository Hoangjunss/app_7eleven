import { useQuery } from "@tanstack/react-query";
import { orderService, GetOrdersParams } from "@/services/orderService";
import { useAuthStore } from "@/stores/authStore";

export const MY_ORDERS_KEY = "myOrders";

/**
 * Fetch paginated order list for the current authenticated user.
 */
export function useMyOrders(params?: GetOrdersParams) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: [MY_ORDERS_KEY, params],
    queryFn: () => orderService.getMyOrders(params),
    enabled: isAuthenticated,
    staleTime: 30 * 1000,
  });
}
