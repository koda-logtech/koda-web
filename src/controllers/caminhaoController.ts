import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { caminhaoService } from "@services/caminhaoService";

export const useCaminhoes = (page?: number, limit?: number, options: any = {}) => {
  return useQuery<any>({
    queryKey: ["caminhoes", page, limit],
    queryFn: () => caminhaoService.getAll(page, limit),
    ...options,
  });
};

export const useCreateCaminhao = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => caminhaoService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caminhoes"] });
    },
  });
};

export const useDeleteCaminhao = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => caminhaoService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caminhoes"] });
    },
  });
};
