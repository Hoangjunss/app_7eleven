import { useQuery } from "@tanstack/react-query";
import { productService } from "@/services/productService";

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () => productService.getCategories(),
  });
}
