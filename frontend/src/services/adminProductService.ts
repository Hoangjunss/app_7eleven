import apiClient from "@/lib/axios";
import { Product, ApiResponse, PageResponse } from "./productService";

export interface AdminGetProductsParams {
  page?: number;
  size?: number;
  name?: string;
  categoryId?: string | number;
  minPrice?: string | number;
  maxPrice?: string | number;
  sortBy?: string;
  direction?: string;
}

export interface AdminProductRequest {
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  categoryId: number;
}

export const adminProductService = {
  async getProducts(params: AdminGetProductsParams): Promise<ApiResponse<PageResponse<Product>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<Product>>>("/admin/products", {
      params: {
        page: params.page ?? 0,
        size: params.size ?? 10,
        name: params.name || "",
        categoryId: params.categoryId || "",
        minPrice: params.minPrice || "",
        maxPrice: params.maxPrice || "",
        sortBy: params.sortBy || "createdAt",
        direction: params.direction || "desc",
      },
    });
    return response.data;
  },

  async getProductById(id: string | number): Promise<ApiResponse<Product>> {
    const response = await apiClient.get<ApiResponse<Product>>(`/admin/products/${id}`);
    return response.data;
  },

  async createProduct(
    product: AdminProductRequest,
    images?: File[],
    primaryImageIndex?: number
  ): Promise<ApiResponse<Product>> {
    if (images && images.length > 0) {
      const formData = new FormData();
      formData.append(
        "product",
        new Blob([JSON.stringify(product)], { type: "application/json" })
      );
      images.forEach((image) => {
        formData.append("images", image);
      });
      if (primaryImageIndex !== undefined) {
        formData.append("primaryImageIndex", primaryImageIndex.toString());
      }

      const response = await apiClient.post<ApiResponse<Product>>("/admin/products", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } else {
      const response = await apiClient.post<ApiResponse<Product>>("/admin/products", product);
      return response.data;
    }
  },

  async updateProduct(id: number, product: AdminProductRequest): Promise<ApiResponse<Product>> {
    const response = await apiClient.put<ApiResponse<Product>>(`/admin/products/${id}`, product);
    return response.data;
  },

  async deleteProduct(id: number): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>(`/admin/products/${id}`);
    return response.data;
  },

  async uploadProductImages(
    id: number,
    images: File[],
    primaryImageIndex?: number
  ): Promise<ApiResponse<Product>> {
    const formData = new FormData();
    images.forEach((image) => {
      formData.append("images", image);
    });
    if (primaryImageIndex !== undefined) {
      formData.append("primaryImageIndex", primaryImageIndex.toString());
    }

    const response = await apiClient.post<ApiResponse<Product>>(`/admin/products/${id}/images`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },
};
