import { useCartStore } from "../cartStore";
import { cartService } from "@/services/cartService";

// Mock the cart service and sonner toast
jest.mock("@/services/cartService", () => ({
  cartService: {
    addItem: jest.fn(),
    updateItem: jest.fn(),
    removeItem: jest.fn(),
    clearCart: jest.fn(),
  },
}));

jest.mock("sonner", () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

describe("useCartStore", () => {
  const mockInvalidate = jest.fn();

  beforeEach(() => {
    // Reset Zustand store state before each test
    useCartStore.setState({
      items: [],
      totalAmount: 0,
      itemCount: 0,
      isLoading: false,
    });
    jest.clearAllMocks();
  });

  it("should initialize with default values", () => {
    const state = useCartStore.getState();
    expect(state.items).toEqual([]);
    expect(state.totalAmount).toBe(0);
    expect(state.itemCount).toBe(0);
    expect(state.isLoading).toBe(false);
  });

  it("should sync cart items and compute quantity totals correctly", () => {
    const mockItems = [
      { id: 1, productId: 10, productName: "Sữa tươi", price: 12000, quantity: 2, subtotal: 24000, imageUrl: "" },
      { id: 2, productId: 22, productName: "Bánh mì", price: 15000, quantity: 1, subtotal: 15000, imageUrl: "" },
    ];

    useCartStore.getState().syncCart(mockItems, 39000);

    const state = useCartStore.getState();
    expect(state.items).toEqual(mockItems);
    expect(state.totalAmount).toBe(39000);
    expect(state.itemCount).toBe(3); // 2 + 1
  });

  it("should call addItem API and invalidate cached query keys on success", async () => {
    (cartService.addItem as jest.Mock).mockResolvedValue({});

    await useCartStore.getState().addItem(10, 2, mockInvalidate);

    expect(cartService.addItem).toHaveBeenCalledWith(10, 2);
    expect(mockInvalidate).toHaveBeenCalled();
    expect(useCartStore.getState().isLoading).toBe(false);
  });

  it("should call updateItem API and invalidate cached query keys on success", async () => {
    (cartService.updateItem as jest.Mock).mockResolvedValue({});

    await useCartStore.getState().updateItem(10, 3, mockInvalidate);

    expect(cartService.updateItem).toHaveBeenCalledWith(10, 3);
    expect(mockInvalidate).toHaveBeenCalled();
  });

  it("should call removeItem API and invalidate query keys on success", async () => {
    (cartService.removeItem as jest.Mock).mockResolvedValue({});

    await useCartStore.getState().removeItem(10, mockInvalidate);

    expect(cartService.removeItem).toHaveBeenCalledWith(10);
    expect(mockInvalidate).toHaveBeenCalled();
  });

  it("should call clearCart API and invalidate query keys on success", async () => {
    (cartService.clearCart as jest.Mock).mockResolvedValue({});

    await useCartStore.getState().clearCart(mockInvalidate);

    expect(cartService.clearCart).toHaveBeenCalled();
    expect(mockInvalidate).toHaveBeenCalled();
  });
});
