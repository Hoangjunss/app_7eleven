import React from "react";
import { render, screen } from "@testing-library/react";
import TopProductsList from "../TopProductsList";
import { TopProductData } from "@/services/adminDashboardService";

describe("TopProductsList Component", () => {
  const mockTopProducts: TopProductData[] = [
    {
      productId: 1,
      productName: "Coca Cola",
      totalQuantitySold: 150,
      totalRevenue: 1500000,
    },
    {
      productId: 2,
      productName: "Pepsi",
      totalQuantitySold: 90,
      totalRevenue: 900000,
    },
  ];

  it("should render loading skeletons when isLoading is true", () => {
    const { container } = render(<TopProductsList data={undefined} isLoading={true} />);
    const skeletonElements = container.getElementsByClassName("animate-pulse");
    expect(skeletonElements.length).toBe(5);
  });

  it("should render empty state message when data is empty", () => {
    render(<TopProductsList data={[]} isLoading={false} />);
    expect(screen.getByText("Chưa có sản phẩm bán chạy trong kì lọc.")).toBeInTheDocument();
  });

  it("should render top products list with correct names and quantities when loaded", () => {
    render(<TopProductsList data={mockTopProducts} isLoading={false} />);

    // Check product names
    expect(screen.getByText("Coca Cola")).toBeInTheDocument();
    expect(screen.getByText("Pepsi")).toBeInTheDocument();

    // Check product quantities
    expect(screen.getByText("150 sản phẩm")).toBeInTheDocument();
    expect(screen.getByText("90 sản phẩm")).toBeInTheDocument();

    // Check ranking text
    expect(screen.getByText("Top 1")).toBeInTheDocument();
    expect(screen.getByText("Top 2")).toBeInTheDocument();
  });
});
