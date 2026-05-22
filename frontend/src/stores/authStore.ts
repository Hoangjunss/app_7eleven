/**
 * Zustand authentication store with local storage persistence.
 * SSR-safe, manages user info, roles, and auth states.
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import apiClient from "@/lib/axios";

export interface UserState {
  email: string;
  fullName: string;
  roles: string[];
}

export interface AuthResponse {
  token: string;
  email: string;
  fullName: string;
  roles: string[];
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  status: number;
}

interface AuthState {
  user: UserState | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  role: string | null;
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (data: { email: string; password?: string; fullName: string }) => Promise<string>;
  logout: () => Promise<void>;
}

// SSR-safe storage helper to avoid "localStorage is not defined" error in Next.js Server Components
const ssrSafeStorage = createJSONStorage<AuthState>(() => {
  if (typeof window !== "undefined") {
    return window.localStorage;
  }
  return {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  } as unknown as Storage;
});

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      role: null,

      login: async (email, password) => {
        const response = await apiClient.post<ApiResponse<AuthResponse>>("/auth/login", {
          email,
          password,
        });
        const authData = response.data.data;
        const role = authData.roles.includes("ADMIN") ? "ADMIN" : "USER";

        set({
          user: {
            email: authData.email,
            fullName: authData.fullName,
            roles: authData.roles,
          },
          accessToken: authData.token,
          isAuthenticated: true,
          role,
        });

        return authData;
      },

      register: async (data) => {
        const response = await apiClient.post<ApiResponse<string>>("/auth/register", data);
        return response.data.data || response.data.message;
      },

      logout: async () => {
        try {
          // Optional API call to trigger server-side logout audit logs
          await apiClient.post("/auth/logout");
        } catch (error) {
          console.warn("Server-side logout audit log failed", error);
        } finally {
          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            role: null,
          });
        }
      },
    }),
    {
      name: "auth-storage",
      storage: ssrSafeStorage,
      // Persist only tokens and basic states to avoid hydration mismatch, or persist everything.
      // We will persist everything for local session persistence.
    }
  )
);
