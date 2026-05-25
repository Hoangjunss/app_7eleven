import apiClient from "@/lib/axios";
import { Order } from "@/services/orderService";

export interface DashboardKpi {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalUsers: number;
  orderCountByStatus: Record<string, number>;
}

export interface RevenueChartData {
  date: string;
  revenue: number;
  orderCount: number;
}

export interface TopProductData {
  productId: number;
  productName: string;
  totalQuantitySold: number;
  totalRevenue: number;
}

export const adminDashboardService = {
  getKpi: async (startDate: string, endDate: string): Promise<DashboardKpi> => {
    const res = await apiClient.get(`/admin/dashboard/kpi`, {
      params: { startDate, endDate },
    });
    return res.data.data;
  },

  getRevenueChart: async (startDate: string, endDate: string): Promise<RevenueChartData[]> => {
    const res = await apiClient.get(`/admin/dashboard/revenue`, {
      params: { startDate, endDate },
    });
    return res.data.data;
  },

  getTopProducts: async (startDate: string, endDate: string, limit = 5): Promise<TopProductData[]> => {
    const res = await apiClient.get(`/admin/dashboard/top-products`, {
      params: { startDate, endDate, limit },
    });
    return res.data.data;
  },

  getRecentOrders: async (limit = 5): Promise<Order[]> => {
    const res = await apiClient.get(`/admin/dashboard/recent-orders`, {
      params: { limit },
    });
    return res.data.data;
  },

  getRevenueStats: async (startDate: string, endDate: string): Promise<any> => {
    const res = await apiClient.get(`/admin/dashboard/revenue-stats`, {
      params: { startDate, endDate },
    });
    return res.data.data;
  },

  getOrderStats: async (startDate: string, endDate: string): Promise<any> => {
    const res = await apiClient.get(`/admin/dashboard/order-stats`, {
      params: { startDate, endDate },
    });
    return res.data.data;
  },


  getUserStats: async (startDate: string, endDate: string): Promise<any> => {
    const res = await apiClient.get(`/admin/dashboard/user-stats`, {
      params: { startDate, endDate },
    });
    return res.data.data;
  },

  getCategoryRevenue: async (startDate: string, endDate: string): Promise<any> => {
    const res = await apiClient.get(`/admin/dashboard/category-revenue`, {
      params: { startDate, endDate },
    });
    return res.data.data;
  },
};
