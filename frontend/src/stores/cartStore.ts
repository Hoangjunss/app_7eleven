/**
 * Zustand cart store – holds client-side cart state.
 * All mutations call the API then invalidate the React Query ["cart"] key
 * so the hook re-fetches the authoritative server data.
 *
 * NOT persisted – cart lives in Redis on the server.
 */
import { create } from "zustand";
import { cartService, CartItem } from "@/services/cartService";
import { toast } from "sonner";

interface CartState {
  items: CartItem[];
  totalAmount: number;
  itemCount: number;
  isLoading: boolean;

  // Called by CartSync to populate from server data
  syncCart: (items: CartItem[], totalAmount: number) => void;

  // Mutations – each calls the API, then triggers a React Query invalidation
  // via the queryClient passed in (avoids circular dependency)
  addItem: (
    productId: number,
    quantity: number,
    invalidate: () => void
  ) => Promise<void>;
  updateItem: (
    productId: number,
    quantity: number,
    invalidate: () => void
  ) => Promise<void>;
  removeItem: (productId: number, invalidate: () => void) => Promise<void>;
  clearCart: (invalidate: () => void) => Promise<void>;
}

export const useCartStore = create<CartState>()((set, get) => ({
  items: [],
  totalAmount: 0,
  itemCount: 0,
  isLoading: false,

  syncCart: (items, totalAmount) => {
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    set({ items, totalAmount, itemCount });
  },

  addItem: async (productId, quantity, invalidate) => {
    set({ isLoading: true });
    try {
      await cartService.addItem(productId, quantity);
      invalidate();
    } catch (err) {
      console.error("addItem error:", err);
      throw err; // re-throw so caller can show toast
    } finally {
      set({ isLoading: false });
    }
  },

  updateItem: async (productId, quantity, invalidate) => {
    set({ isLoading: true });
    try {
      await cartService.updateItem(productId, quantity);
      invalidate();
    } catch (err) {
      console.error("updateItem error:", err);
      toast.error("Không thể cập nhật số lượng. Vui lòng thử lại.");
    } finally {
      set({ isLoading: false });
    }
  },

  removeItem: async (productId, invalidate) => {
    set({ isLoading: true });
    try {
      await cartService.removeItem(productId);
      invalidate();
    } catch (err) {
      console.error("removeItem error:", err);
      toast.error("Không thể xóa sản phẩm. Vui lòng thử lại.");
    } finally {
      set({ isLoading: false });
    }
  },

  clearCart: async (invalidate) => {
    set({ isLoading: true });
    try {
      await cartService.clearCart();
      invalidate();
    } catch (err) {
      console.error("clearCart error:", err);
      toast.error("Không thể xóa giỏ hàng. Vui lòng thử lại.");
    } finally {
      set({ isLoading: false });
    }
  },
}));
