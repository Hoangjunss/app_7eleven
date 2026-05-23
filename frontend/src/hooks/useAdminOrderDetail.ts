import { useQuery } from "@tanstack/react-query";
import { orderService } from "@/services/orderService";
import { useAuthStore } from "@/stores/authStore";

/**
 * Fetch a single order by ID using the admin endpoint.
 * Only enabled when user has ADMIN role and ID is provided.
 */
export function useAdminOrderDetail(id: string | number | undefined) {
  const { isAuthenticated, role } = useAuthStore();

  return useQuery({
    queryKey: ["adminOrder", id],
    queryFn: () => orderService.getOrderByIdAdmin(id!),
    enabled: !!id && isAuthenticated && role === "ADMIN",
    staleTime: 30 * 1000,
  });
}
