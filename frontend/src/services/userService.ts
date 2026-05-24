import apiClient from "@/lib/axios";

export interface UserProfile {
  id: number;
  email: string;
  fullName: string;
  roles: string[];
  createdAt: string;
  updatedAt: string;
}

export const userService = {
  getProfile: async (): Promise<UserProfile> => {
    const res = await apiClient.get("/users/me");
    return res.data.data;
  },

  updateProfile: async (fullName: string): Promise<UserProfile> => {
    const res = await apiClient.put("/users/profile", { fullName });
    return res.data.data;
  },

  changePassword: async (oldPassword: string, newPassword: string): Promise<string> => {
    const res = await apiClient.put("/users/change-password", { oldPassword, newPassword });
    return res.data.message;
  },
};
