import { useQuery } from "@tanstack/react-query";
import { productService, GetProductsParams } from "@/services/productService";

export function useProducts(params: GetProductsParams) {
  return useQuery({
    queryKey: ["products", params],
    queryFn: () => productService.getProducts(params),
    placeholderData: (previousData) => previousData,
  });
}
