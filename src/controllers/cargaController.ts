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
      queryClient.invalidateQueries({ queryKey: ["carga-telemetria-auditoria"] });
    },
  });
};

export const useUpdateCarga = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: Partial<Omit<Carga, "id" | "created_at" | "updated_at">>;
    }) => cargaService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cargas"] });
      queryClient.invalidateQueries({ queryKey: ["carga-telemetria-auditoria"] });
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
      queryClient.invalidateQueries({ queryKey: ["carga-telemetria-auditoria"] });
    },
  });
};

export const useTelemetriaAuditoria = (page: number, limit: number) => {
  return useQuery({
    queryKey: ["carga-telemetria-auditoria", page, limit],
    queryFn: () => cargaService.listTelemetriaAuditoria(page, limit),
    /** Polling ~tempo real (alinhado ao envio do app BLE a cada 5 s). */
    staleTime: 0,
    refetchInterval: 5_000,
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: true,
  });
};

export const useTelemetriaAuditoriaPorCarga = (
  idCarga: number | null,
  options: { refetchInterval?: number } = {},
) => {
  return useQuery({
    queryKey: ["carga-telemetria-auditoria", "por-carga", idCarga],
    queryFn: () => cargaService.listTelemetriaAuditoriaPorCarga(idCarga!),
    enabled: idCarga != null && idCarga > 0,
    staleTime: 0,
    refetchInterval: options.refetchInterval,
    refetchIntervalInBackground: options.refetchInterval != null,
  });
};
