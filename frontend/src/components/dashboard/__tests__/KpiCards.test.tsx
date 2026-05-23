import React from "react";
import { render, screen } from "@testing-library/react";
import KpiCards from "../KpiCards";
import { DashboardKpi } from "@/services/adminDashboardService";

describe("KpiCards Component", () => {
  const mockKpi: DashboardKpi = {
    totalRevenue: 25000000,
    totalOrders: 120,
    totalProducts: 45,
    totalUsers: 80,
    orderCountByStatus: {
      PENDING: 10,
      DELIVERED: 110,
    },
  };

  const formatVND = (num: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(num || 0);
  };

  it("should render skeleton placeholder dots when isLoading is true", () => {
    render(<KpiCards kpi={undefined} isLoading={true} formatVND={formatVND} />);
    const placeholders = screen.getAllByText("...");
    expect(placeholders.length).toBe(4);
  });

  it("should render correct values when loading completes", () => {
    render(<KpiCards kpi={mockKpi} isLoading={false} formatVND={formatVND} />);
    
    // Revenue formatted in VND (uses regex to ignore spaces/non-breaking spaces/currency symbol variations)
    expect(screen.getByText(/25\.000\.000/)).toBeInTheDocument();

    // Counts formatted as strings
    expect(screen.getByText("120")).toBeInTheDocument();
    expect(screen.getByText("45")).toBeInTheDocument();
    expect(screen.getByText("80")).toBeInTheDocument();

    // Check titles are present
    expect(screen.getByText("Tổng Doanh Thu (Delivered)")).toBeInTheDocument();
    expect(screen.getByText("Tổng Đơn Hàng (Khoảng lọc)")).toBeInTheDocument();
    expect(screen.getByText("Sản Phẩm Đang Bán")).toBeInTheDocument();
    expect(screen.getByText("Người Dùng Đăng Ký")).toBeInTheDocument();
  });
});
