import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { entregaService } from "@services/entregaService";
import type { Entrega } from "@/types/models";

export const useEntregasCompleto = (page?: number, limit?: number, options: any = {}) => {
  return useQuery<any>({
    queryKey: ["entregas", "completo", page, limit],
    queryFn: () => entregaService.getCompleto(page, limit),
    ...options,
  });
};

export const useCreateEntrega = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<Entrega, "id" | "created_at" | "updated_at">) =>
      entregaService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entregas"] });
    },
  });
};

export const useDeleteEntrega = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => entregaService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entregas"] });
    },
  });
};
