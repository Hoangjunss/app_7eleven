import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orderService, CreateOrderPayload } from "@/services/orderService";
import { CART_QUERY_KEY } from "@/hooks/useCart";

/**
 * Mutation hook to create a new order.
 * On success, automatically invalidates the ["cart"] query so badge clears.
 */
export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateOrderPayload) => orderService.createOrder(payload),
    onSuccess: () => {
      // Invalidate cart so CartSync re-fetches → badge resets to 0
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
    },
  });
}
