import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orderService, OrderStatus } from "@/services/orderService";
import { ALL_ORDERS_KEY } from "@/hooks/useAllOrders";

/**
 * Admin mutation to update order status via PATCH /admin/orders/{id}/status?status=
 * Invalidates both the specific admin order detail and the orders list.
 */
export function useUpdateOrderStatus(orderId: string | number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (status: OrderStatus) => orderService.updateOrderStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminOrder", orderId] });
      queryClient.invalidateQueries({ queryKey: [ALL_ORDERS_KEY] });
    },
  });
}
