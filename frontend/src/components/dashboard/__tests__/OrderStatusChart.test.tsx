import React from "react";
import { render, screen } from "@testing-library/react";
import OrderStatusChart from "../OrderStatusChart";
import { DashboardKpi } from "@/services/adminDashboardService";

// Mock recharts because ResponsiveContainer needs custom sizing that doesn't exist in JSDOM
jest.mock("recharts", () => {
  const React = require("react");
  return {
    ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
    PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
    Pie: ({ children, data }: any) => <div data-testid="pie-element" data-data={JSON.stringify(data)}>{children}</div>,
    Cell: () => <div data-testid="cell-element" />,
    Tooltip: () => <div data-testid="tooltip-element" />,
    Legend: () => <div data-testid="legend-element" />,
  };
});

describe("OrderStatusChart Component", () => {
  const mockKpi: DashboardKpi = {
    totalRevenue: 25000000,
    totalOrders: 120,
    totalProducts: 45,
    totalUsers: 80,
    orderCountByStatus: {
      PENDING: 10,
      DELIVERED: 110,
      CANCELLED: 0,
    },
  };

  it("should render loading placeholder when isLoading is true", () => {
    render(<OrderStatusChart kpi={undefined} isLoading={true} />);
    expect(screen.getByText("Đang tải dữ liệu biểu đồ...")).toBeInTheDocument();
  });

  it("should render empty state message when there are no orders with count > 0", () => {
    const emptyKpi: DashboardKpi = {
      totalRevenue: 0,
      totalOrders: 0,
      totalProducts: 10,
      totalUsers: 5,
      orderCountByStatus: {
        PENDING: 0,
        DELIVERED: 0,
        CANCELLED: 0,
      },
    };
    render(<OrderStatusChart kpi={emptyKpi} isLoading={false} />);
    expect(screen.getByText("Không có dữ liệu đơn hàng")).toBeInTheDocument();
  });

  it("should render pie chart elements when loaded with data", () => {
    render(<OrderStatusChart kpi={mockKpi} isLoading={false} />);

    // Responsive container and pie chart wrapper should be rendered
    expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    expect(screen.getByTestId("pie-chart")).toBeInTheDocument();

    const pie = screen.getByTestId("pie-element");
    expect(pie).toBeInTheDocument();
    
    // Check if correct data was converted and filtered (only status with value > 0 is mapped)
    const passedData = JSON.parse(pie.getAttribute("data-data") || "[]");
    expect(passedData.length).toBe(2); // PENDING and DELIVERED
    expect(passedData[0]).toEqual({ name: "Chờ xác nhận", value: 10 });
    expect(passedData[1]).toEqual({ name: "Đã giao", value: 110 });
  });
});
