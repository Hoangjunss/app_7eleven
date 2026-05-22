import { useQuery } from "@tanstack/react-query";
import { orderService } from "@/services/orderService";
import { useAuthStore } from "@/stores/authStore";

/**
 * Fetch a single order by ID.
 * Only enabled when user is authenticated and ID is provided.
 */
export function useOrderDetail(id: string | number | undefined) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: ["order", id],
    queryFn: () => orderService.getOrderById(id!),
    enabled: !!id && isAuthenticated,
    staleTime: 30 * 1000, // 30s – refresh if user stays on page
  });
}
