import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminProductService, AdminGetProductsParams, AdminProductRequest } from "@/services/adminProductService";

export function useAdminProducts(params: AdminGetProductsParams) {
  return useQuery({
    queryKey: ["admin-products", params],
    queryFn: () => adminProductService.getProducts(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useAdminProductDetail(id: string | number) {
  return useQuery({
    queryKey: ["admin-products", id],
    queryFn: () => adminProductService.getProductById(id),
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      product,
      images,
      primaryImageIndex,
    }: {
      product: AdminProductRequest;
      images?: File[];
      primaryImageIndex?: number;
    }) => adminProductService.createProduct(product, images, primaryImageIndex),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, product }: { id: number; product: AdminProductRequest }) =>
      adminProductService.updateProduct(id, product),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-products", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => adminProductService.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useUploadProductImages() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      images,
      primaryImageIndex,
    }: {
      id: number;
      images: File[];
      primaryImageIndex?: number;
    }) => adminProductService.uploadProductImages(id, images, primaryImageIndex),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-products", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
