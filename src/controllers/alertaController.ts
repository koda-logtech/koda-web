import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { alertaService, type AlertaQueryParams } from "@services/alertaService";
import type { CargaAlerta, CargaAlertaStatus } from "@/types/models";

/** Polling padrão dos alertas (atualização "ao vivo" no painel e na contagem). */
export const ALERTAS_LIVE_REFETCH_MS = 10_000;

export const useAlertas = (
  params: AlertaQueryParams = {},
  options: Record<string, unknown> = {},
) => {
  return useQuery<CargaAlerta[]>({
    queryKey: ["alertas", params],
    queryFn: () => alertaService.getAll(params),
    ...options,
  });
};

export const useAlertasCount = (
  status: CargaAlertaStatus = "aberto",
  options: Record<string, unknown> = {},
) => {
  return useQuery<number>({
    queryKey: ["alertas", "count", status],
    queryFn: () => alertaService.count(status),
    ...options,
  });
};

export const useCancelarAlerta = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => alertaService.cancelar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alertas"] });
    },
  });
};
