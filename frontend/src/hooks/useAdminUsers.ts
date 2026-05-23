import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminUserService, AdminGetUsersParams } from "@/services/adminUserService";

export function useAdminUsers(params: AdminGetUsersParams) {
  return useQuery({
    queryKey: ["admin-users", params],
    queryFn: () => adminUserService.getUsers(params),
  });
}

export function useUpdateUserRoles() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, roles }: { id: number; roles: string[] }) =>
      adminUserService.updateUserRoles(id, roles),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
}

export function useLockUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => adminUserService.lockUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
}

export function useRestoreUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => adminUserService.restoreUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
}
