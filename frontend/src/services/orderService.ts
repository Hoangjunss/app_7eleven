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

export interface GetAdminOrdersParams {
  page?: number;
  size?: number;
  status?: OrderStatus;
  userId?: number;
  sortBy?: string;
  direction?: "asc" | "desc";
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
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
  async getMyOrders(params?: GetOrdersParams): Promise<ApiResponse<PagedResponse<Order>>> {
    const res = await apiClient.get<ApiResponse<PagedResponse<Order>>>("/orders", { params });
    return res.data;
  },

  /** PATCH /api/v1/orders/{id}/cancel */
  async cancelOrder(id: number | string): Promise<ApiResponse<null>> {
    const res = await apiClient.patch<ApiResponse<null>>(`/orders/${id}/cancel`);
    return res.data;
  },

  // ─── Admin ──────────────────────────────────────────────────────────────

  /** GET /api/v1/admin/orders?page=&size=&status=&userId= */
  async getAllOrdersAdmin(params?: GetAdminOrdersParams): Promise<ApiResponse<PagedResponse<Order>>> {
    const res = await apiClient.get<ApiResponse<PagedResponse<Order>>>("/admin/orders", { params });
    return res.data;
  },

  /** GET /api/v1/admin/orders/{id} */
  async getOrderByIdAdmin(id: number | string): Promise<ApiResponse<Order>> {
    const res = await apiClient.get<ApiResponse<Order>>(`/admin/orders/${id}`);
    return res.data;
  },

  /**
   * PATCH /api/v1/admin/orders/{id}/status?status={status}
   * Backend uses @RequestParam, so status must be a query param not body.
   */
  async updateOrderStatus(id: number | string, status: OrderStatus): Promise<ApiResponse<Order>> {
    const res = await apiClient.patch<ApiResponse<Order>>(
      `/admin/orders/${id}/status`,
      null,
      { params: { status } }
    );
    return res.data;
  },
};

