import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orderService } from "@/services/orderService";

/**
 * Mutation hook to cancel an order.
 * Invalidates the specific order query so the detail page refreshes status.
 */
export function useCancelOrder(orderId: string | number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => orderService.cancelOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
    },
  });
}
