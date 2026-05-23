import React from "react";
import type { Metadata } from "next";
import ProductDetailClient from "@/components/product/ProductDetailClient";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
    // Fetch product details directly from the API for server-side SEO metadata generation
    const res = await fetch(`${baseUrl}/products/${id}`, { next: { revalidate: 60 } });
    if (!res.ok) {
      return {
        title: "Sản phẩm không tồn tại",
      };
    }
    const apiRes = await res.json();
    const product = apiRes?.data;

    if (!product) {
      return {
        title: "Sản phẩm không tồn tại",
      };
    }

    return {
      title: product.name,
      description: product.description || `Mua sản phẩm ${product.name} chất lượng cao giá tốt tại 7Eleven Shop.`,
      openGraph: {
        title: `${product.name} | 7Eleven Shop`,
        description: product.description || `Mua sản phẩm ${product.name} chất lượng cao giá tốt tại 7Eleven Shop.`,
        images: product.primaryImageUrl ? [{ url: product.primaryImageUrl }] : [],
      },
    };
  } catch (error) {
    console.error("Error generating product metadata:", error);
    return {
      title: "Chi tiết sản phẩm",
    };
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  return <ProductDetailClient id={id} />;
}
