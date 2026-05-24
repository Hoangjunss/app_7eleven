import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userService } from "@/services/userService";

export function useUserProfile() {
  return useQuery({
    queryKey: ["user", "profile"],
    queryFn: () => userService.getProfile(),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (fullName: string) => userService.updateProfile(fullName),
    onSuccess: (data) => {
      queryClient.setQueryData(["user", "profile"], data);
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: ({ oldPassword, newPassword }: { oldPassword: string; newPassword: string }) =>
      userService.changePassword(oldPassword, newPassword),
  });
}
