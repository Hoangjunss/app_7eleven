import { useAuthStore } from "../authStore";
import apiClient from "@/lib/axios";

// Mock the API client
jest.mock("@/lib/axios", () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
  },
}));

describe("useAuthStore", () => {
  beforeEach(() => {
    // Reset Zustand store state before each test
    useAuthStore.setState({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      role: null,
    });
    jest.clearAllMocks();
  });

  it("should initialize with default empty credentials", () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.role).toBeNull();
  });

  it("should perform login successfully and parse USER role", async () => {
    const mockAuthResponse = {
      data: {
        status: 200,
        message: "Success",
        data: {
          token: "mock-token-abc",
          email: "user@test.com",
          fullName: "User Test",
          roles: ["USER"],
        },
      },
    };

    (apiClient.post as jest.Mock).mockResolvedValue(mockAuthResponse);

    const result = await useAuthStore.getState().login("user@test.com", "password123");

    expect(apiClient.post).toHaveBeenCalledWith("/auth/login", {
      email: "user@test.com",
      password: "password123",
    });

    expect(result.token).toBe("mock-token-abc");
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().role).toBe("USER");
    expect(useAuthStore.getState().user?.fullName).toBe("User Test");
  });

  it("should parse and map ADMIN roles on login", async () => {
    const mockAuthResponse = {
      data: {
        status: 200,
        message: "Success",
        data: {
          token: "mock-token-admin",
          email: "admin@test.com",
          fullName: "Admin Test",
          roles: ["ADMIN"],
        },
      },
    };

    (apiClient.post as jest.Mock).mockResolvedValue(mockAuthResponse);

    await useAuthStore.getState().login("admin@test.com", "admin123");

    expect(useAuthStore.getState().role).toBe("ADMIN");
  });

  it("should trigger logout endpoints and wipe store states", async () => {
    useAuthStore.setState({
      user: { email: "user@test.com", fullName: "User Test", roles: ["USER"] },
      accessToken: "active-token",
      isAuthenticated: true,
      role: "USER",
    });

    (apiClient.post as jest.Mock).mockResolvedValue({ data: { message: "logged out" } });

    await useAuthStore.getState().logout();

    expect(apiClient.post).toHaveBeenCalledWith("/auth/logout");
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().role).toBeNull();
  });
});
