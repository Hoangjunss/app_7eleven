import React from "react";
import { render, screen } from "@testing-library/react";
import RevenueChart from "../RevenueChart";
import { RevenueChartData } from "@/services/adminDashboardService";

// Mock recharts because ResponsiveContainer needs custom sizing that doesn't exist in JSDOM
jest.mock("recharts", () => {
  return {
    ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
    AreaChart: ({ children, data }: any) => <div data-testid="area-chart" data-data={JSON.stringify(data)}>{children}</div>,
    Area: () => <div data-testid="area-element" />,
    XAxis: () => <div data-testid="xaxis-element" />,
    YAxis: () => <div data-testid="yaxis-element" />,
    CartesianGrid: () => <div data-testid="grid-element" />,
    Tooltip: () => <div data-testid="tooltip-element" />,
  };
});

describe("RevenueChart Component", () => {
  const mockChartData: RevenueChartData[] = [
    { date: "2026-05-20", revenue: 500000, orderCount: 5 },
    { date: "2026-05-21", revenue: 750000, orderCount: 8 },
  ];

  const formatVND = (num: number) => `${num.toLocaleString()} ₫`;

  it("should render loading placeholder when isLoading is true", () => {
    render(<RevenueChart data={undefined} isLoading={true} formatVND={formatVND} />);
    expect(screen.getByText("Đang tải dữ liệu biểu đồ...")).toBeInTheDocument();
  });

  it("should render chart canvas and elements when loaded", () => {
    render(
      <RevenueChart data={mockChartData} isLoading={false} formatVND={formatVND} />
    );

    // Responsive container and chart wrapper should be rendered
    expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    const chart = screen.getByTestId("area-chart");
    expect(chart).toBeInTheDocument();
    
    // Check if the mock data attribute was passed down properly
    expect(chart.getAttribute("data-data")).toContain("2026-05-20");
    expect(chart.getAttribute("data-data")).toContain("2026-05-21");

    // Inner Recharts elements should exist
    expect(screen.getByTestId("area-element")).toBeInTheDocument();
  });
});
