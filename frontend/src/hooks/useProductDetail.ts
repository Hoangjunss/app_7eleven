import { useQuery } from "@tanstack/react-query";
import { productService } from "@/services/productService";

export function useProductDetail(id: string | number) {
  return useQuery({
    queryKey: ["product", id],
    queryFn: () => productService.getProductById(id),
    enabled: !!id,
  });
}
