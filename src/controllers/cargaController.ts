import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cargaService } from "@services/cargaService";
import type { Carga } from "@/types/models";

export const useCargas = (page?: number, limit?: number, options: Record<string, unknown> = {}) => {
  return useQuery({
    queryKey: ["cargas", page, limit],
    queryFn: () => cargaService.getAll(page, limit),
    ...options,
  });
};

export const useCreateCarga = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<Carga, "id" | "created_at" | "updated_at">) =>
      cargaService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cargas"] });
    },
  });
};

export const useDeleteCarga = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => cargaService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cargas"] });
      queryClient.invalidateQueries({ queryKey: ["caminhoes"] });
    },
  });
};
