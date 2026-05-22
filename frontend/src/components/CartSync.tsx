"use client";

/**
 * CartSync – invisible component mounted in AppLayout.
 * Watches the React Query cart data and syncs it into the Zustand cartStore.
 * This decouples the server-state (React Query) from the client-state (Zustand).
 */
import { useEffect } from "react";
import { useCart } from "@/hooks/useCart";
import { useCartStore } from "@/stores/cartStore";

export default function CartSync() {
  const { data } = useCart();
  const syncCart = useCartStore((s) => s.syncCart);

  useEffect(() => {
    if (data?.data) {
      syncCart(data.data.items ?? [], data.data.totalAmount ?? 0);
    } else {
      syncCart([], 0);
    }
  }, [data, syncCart]);

  return null; // renders nothing
}
