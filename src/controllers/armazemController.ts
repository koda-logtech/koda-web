import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { armazemService } from "@services/armazemService";

export const useArmazens = (page?: number, limit?: number, options: any = {}) => {
  return useQuery<any>({
    queryKey: ["armazens", page, limit],
    queryFn: () => armazemService.getAll(page, limit),
    ...options,
  });
};

export const useCreateArmazem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => armazemService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["armazens"] });
    },
  });
};

export const useUpdateArmazem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: any }) =>
      armazemService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["armazens"] });
    },
  });
};

export const useDeleteArmazem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => armazemService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["armazens"] });
    },
  });
};
