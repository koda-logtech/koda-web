import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userService } from "@services/userService";

export const useUsers = (page: number = 1, perPage: number = 0, options: any = {}) => {
  return useQuery<any>({
    queryKey: ["users", page, perPage],
    queryFn: () => userService.getAll(page, perPage),
    ...options,
  });
};

export const useCreateUser = () => {
  const qc = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: (data: any) => userService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
};

export const useUpdateUser = () => {
  const qc = useQueryClient();
  return useMutation<any, Error, { id: number; payload: any }>({
    mutationFn: ({ id, payload }) => userService.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
};

export const useDeleteUser = () => {
  const qc = useQueryClient();
  return useMutation<any, Error, number>({
    mutationFn: (id: number) => userService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
};
