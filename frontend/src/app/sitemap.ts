import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

  const staticRoutes = [
    { url: baseUrl, lastModified: new Date() },
    { url: `${baseUrl}/cart`, lastModified: new Date() },
    { url: `${baseUrl}/login`, lastModified: new Date() },
    { url: `${baseUrl}/register`, lastModified: new Date() },
  ];

  try {
    // Fetch products dynamically to construct product routes in the sitemap
    const res = await fetch(`${apiUrl}/products?size=100`, { next: { revalidate: 3600 } });
    if (!res.ok) {
      return staticRoutes;
    }
    const apiRes = await res.json();
    const products = apiRes?.data?.content || [];

    const productRoutes = products.map((prod: any) => ({
      url: `${baseUrl}/products/${prod.id}`,
      lastModified: new Date(prod.updatedAt || prod.createdAt || new Date()),
    }));

    return [...staticRoutes, ...productRoutes];
  } catch (error) {
    console.error("Error generating sitemap:", error);
    return staticRoutes;
  }
}
