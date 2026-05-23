import React from "react";
import { render, screen } from "@testing-library/react";
import OrderStatusBadge from "../OrderStatusBadge";

describe("OrderStatusBadge", () => {
  it("should render correctly for PENDING status with amber styling", () => {
    render(<OrderStatusBadge status="PENDING" />);
    const badge = screen.getByText("Chờ xác nhận");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("text-amber-400");
  });

  it("should render correctly for CONFIRMED status with blue brand styling", () => {
    render(<OrderStatusBadge status="CONFIRMED" />);
    const badge = screen.getByText("Đã xác nhận");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("text-[#0C5CAB]");
  });

  it("should render correctly for SHIPPING status with violet styling", () => {
    render(<OrderStatusBadge status="SHIPPING" />);
    const badge = screen.getByText("Đang giao hàng");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("text-violet-400");
  });

  it("should render correctly for DELIVERED status with emerald styling", () => {
    render(<OrderStatusBadge status="DELIVERED" />);
    const badge = screen.getByText("Đã giao hàng");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("text-emerald-400");
  });

  it("should render correctly for CANCELLED status with red styling", () => {
    render(<OrderStatusBadge status="CANCELLED" />);
    const badge = screen.getByText("Đã hủy");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("text-red-400");
  });

  it("should support size sm parameter and modify padding and text styles", () => {
    render(<OrderStatusBadge status="PENDING" size="sm" />);
    const badge = screen.getByText("Chờ xác nhận");
    expect(badge).toHaveClass("text-[10px]");
    expect(badge).toHaveClass("px-2");
    expect(badge).toHaveClass("py-0.5");
  });
});
