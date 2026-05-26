import apiClient from "@/lib/axios";

export interface ProductImage {
  id: number;
  imageUrl: string;
  isPrimary: boolean;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  categoryId: number;
  categoryName: string;
  version: number;
  images: ProductImage[];
  primaryImageUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  status: number;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface GetProductsParams {
  page?: number;
  size?: number;
  search?: string;
  categoryId?: string | number;
  minPrice?: string | number;
  maxPrice?: string | number;
}

export const productService = {
  async getProducts(params: GetProductsParams): Promise<ApiResponse<PageResponse<Product>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<Product>>>("/products", {
      params: {
        page: params.page ?? 0,
        size: params.size ?? 12,
        name: params.search || "",
        categoryId: params.categoryId || "",
        minPrice: params.minPrice || "",
        maxPrice: params.maxPrice || "",
      },
    });
    return response.data;
  },

  async getProductById(id: string | number): Promise<ApiResponse<Product>> {
    const response = await apiClient.get<ApiResponse<Product>>(`/products/${id}`);
    return response.data;
  },

  async getCategories(): Promise<ApiResponse<Category[]>> {
    const response = await apiClient.get<ApiResponse<Category[]>>("/categories");
    return response.data;
  },
};
