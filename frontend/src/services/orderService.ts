/**
 * Order service – wraps all /api/v1/orders REST endpoints.
 * Requires Bearer token (injected automatically by Axios interceptor).
 */
import apiClient from "@/lib/axios";
import { ApiResponse } from "@/services/productService";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface OrderItem {
  id: number;
  productId: number;
  productNameSnapshot: string; // tên SP tại thời điểm đặt hàng
  priceSnapshot: number;       // giá SP tại thời điểm đặt hàng
  quantity: number;
  subtotal: number;
}

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "SHIPPING"
  | "DELIVERED"
  | "CANCELLED";

export interface Order {
  id: number;
  orderCode: string;
  userId: number;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: string;
  totalAmount: number;
  recipientName: string;
  recipientPhone: string;
  deliveryAddress: string;
  note: string | null;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderPayload {
  recipientName: string;
  recipientPhone: string;
  deliveryAddress: string;
  note?: string;
}

export interface GetOrdersParams {
  page?: number;
  size?: number;
  status?: OrderStatus;
  sortBy?: string;
  direction?: "asc" | "desc";
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const orderService = {
  /** POST /api/v1/orders – backend pulls cart from Redis automatically */
  async createOrder(payload: CreateOrderPayload): Promise<ApiResponse<Order>> {
    const res = await apiClient.post<ApiResponse<Order>>("/orders", payload);
    return res.data;
  },

  /** GET /api/v1/orders/{id} */
  async getOrderById(id: number | string): Promise<ApiResponse<Order>> {
    const res = await apiClient.get<ApiResponse<Order>>(`/orders/${id}`);
    return res.data;
  },

  /** GET /api/v1/orders?page=&size=&status= */
  async getMyOrders(params?: GetOrdersParams): Promise<ApiResponse<{
    content: Order[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
  }>> {
    const res = await apiClient.get("/orders", { params });
    return res.data;
  },

  /** PATCH /api/v1/orders/{id}/cancel */
  async cancelOrder(id: number | string): Promise<ApiResponse<null>> {
    const res = await apiClient.patch<ApiResponse<null>>(`/orders/${id}/cancel`);
    return res.data;
  },
};
