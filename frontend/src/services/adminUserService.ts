import apiClient from "@/lib/axios";
import { ApiResponse, PageResponse } from "./productService";

export interface User {
  id: number;
  email: string;
  fullName: string;
  roles: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface AdminGetUsersParams {
  page?: number;
  size?: number;
  search?: string;
}

export const adminUserService = {
  async getUsers(params: AdminGetUsersParams): Promise<ApiResponse<PageResponse<User>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<User>>>("/admin/users", {
      params: {
        page: params.page ?? 0,
        size: params.size ?? 10,
        search: params.search || "",
      },
    });
    return response.data;
  },

  async updateUserRoles(id: number, roles: string[]): Promise<ApiResponse<User>> {
    const response = await apiClient.patch<ApiResponse<User>>(`/admin/users/${id}/roles`, {
      roles,
    });
    return response.data;
  },

  async lockUser(id: number): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>(`/admin/users/${id}`);
    return response.data;
  },

  async restoreUser(id: number): Promise<ApiResponse<void>> {
    const response = await apiClient.patch<ApiResponse<void>>(`/admin/users/${id}/restore`);
    return response.data;
  },
};
