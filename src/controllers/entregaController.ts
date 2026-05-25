import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { entregaService } from "@services/entregaService";
import type { Entrega, EntregaDirectionResponse } from "@/types/models";

export const useEntregasCompleto = (page?: number, limit?: number, options: any = {}) => {
  return useQuery<any>({
    queryKey: ["entregas", "completo", page, limit],
    queryFn: () => entregaService.getCompleto(page, limit),
    ...options,
  });
};

export const useEntregaDirection = (entregaId: number | null, enabled: boolean) => {
  return useQuery<EntregaDirectionResponse>({
    queryKey: ["entregas", entregaId, "direction"],
    queryFn: () => entregaService.getDirection(entregaId!),
    enabled: Boolean(enabled && entregaId !== null && entregaId > 0),
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
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

export const useUpdateEntrega = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: Partial<Omit<Entrega, "id" | "created_at" | "updated_at">>;
    }) => entregaService.update(id, payload),
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
