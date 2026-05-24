import apiClient from "@/lib/axios";
import { Product } from "@/services/productService";
import { Order } from "@/services/orderService";

export interface HotProduct {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
  quantitySold: number;
}

export const dashboardService = {
  getHotProducts: async (): Promise<HotProduct[]> => {
    const res = await apiClient.get("/dashboard/hot-this-month");
    return res.data.data;
  },

  getRecentOrders: async (): Promise<Order[]> => {
    const res = await apiClient.get("/dashboard/recent");
    return res.data.data;
  },

  getSuggestions: async (): Promise<Product[]> => {
    const res = await apiClient.get("/dashboard/suggestions");
    return res.data.data;
  },
};
