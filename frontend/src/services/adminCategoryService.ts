import apiClient from "@/lib/axios";
import { Category, ApiResponse } from "./productService";

export interface AdminCategoryRequest {
  name: string;
  description: string;
}

export const adminCategoryService = {
  async getCategories(): Promise<ApiResponse<Category[]>> {
    const response = await apiClient.get<ApiResponse<Category[]>>("/categories");
    return response.data;
  },

  async createCategory(category: AdminCategoryRequest): Promise<ApiResponse<Category>> {
    const response = await apiClient.post<ApiResponse<Category>>("/admin/categories", category);
    return response.data;
  },

  async updateCategory(id: number, category: AdminCategoryRequest): Promise<ApiResponse<Category>> {
    const response = await apiClient.put<ApiResponse<Category>>(`/admin/categories/${id}`, category);
    return response.data;
  },

  async deleteCategory(id: number): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>(`/admin/categories/${id}`);
    return response.data;
  },
};
