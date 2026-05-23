import { useQuery } from "@tanstack/react-query";
import { cartService } from "@/services/cartService";
import { useAuthStore } from "@/stores/authStore";

export const CART_QUERY_KEY = ["cart"] as const;

/**
 * React Query hook to fetch the authenticated user's cart.
 * Only enabled when the user is logged in.
 */
export function useCart() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: CART_QUERY_KEY,
    queryFn: () => cartService.getCart(),
    enabled: isAuthenticated,
    staleTime: 0,          // always re-fetch after any mutation
    refetchOnWindowFocus: false,
  });
}
