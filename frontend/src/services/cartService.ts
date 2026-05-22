/**
 * Cart service – wraps all /api/v1/cart REST endpoints.
 * All endpoints require a valid Bearer token (injected via Axios interceptor).
 */
import apiClient from "@/lib/axios";
import { ApiResponse } from "@/services/productService";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CartItem {
  productId: number;
  productName: string;
  price: number;
  thumbnailUrl: string | null;
  quantity: number;
  subtotal: number;
}

export interface Cart {
  items: CartItem[];
  totalAmount: number;
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const cartService = {
  /** GET /api/v1/cart */
  async getCart(): Promise<ApiResponse<Cart>> {
    const res = await apiClient.get<ApiResponse<Cart>>("/cart");
    return res.data;
  },

  /** POST /api/v1/cart/items */
  async addItem(productId: number, quantity: number): Promise<ApiResponse<null>> {
    const res = await apiClient.post<ApiResponse<null>>("/cart/items", {
      productId,
      quantity,
    });
    return res.data;
  },

  /** PUT /api/v1/cart/items/{productId} */
  async updateItem(productId: number, quantity: number): Promise<ApiResponse<null>> {
    const res = await apiClient.put<ApiResponse<null>>(`/cart/items/${productId}`, {
      quantity,
    });
    return res.data;
  },

  /** DELETE /api/v1/cart/items/{productId} */
  async removeItem(productId: number): Promise<ApiResponse<null>> {
    const res = await apiClient.delete<ApiResponse<null>>(`/cart/items/${productId}`);
    return res.data;
  },

  /** DELETE /api/v1/cart */
  async clearCart(): Promise<ApiResponse<null>> {
    const res = await apiClient.delete<ApiResponse<null>>("/cart");
    return res.data;
  },
};
