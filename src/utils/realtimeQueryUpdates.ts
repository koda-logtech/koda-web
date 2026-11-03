import type { QueryClient } from '@tanstack/react-query';
import type { CargaTelemetriaAuditoria } from '@/types/models';

export function telemetriaPorCargaQueryKey(idCarga: number) {
  return ['carga-telemetria-auditoria', 'por-carga', idCarga] as const;
}

export function appendTelemetriaPingToCache(
  queryClient: QueryClient,
  idCarga: number,
  row: CargaTelemetriaAuditoria,
): void {
  queryClient.setQueryData<CargaTelemetriaAuditoria[]>(
    telemetriaPorCargaQueryKey(idCarga),
    (prev) => {
      const list = prev ?? [];
      if (list.some((r) => r.id === row.id)) return list;
      const next = [...list, row];
      next.sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));
      return next;
    },
  );
}

export function invalidateEntregasCompleto(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: ['entregas'] });
}

/** Converte payload mínimo do Realtime em linha de auditoria. */
export function mapRealtimeRowToTelemetriaAuditoria(
  raw: Record<string, unknown>,
): CargaTelemetriaAuditoria | null {
  const id = raw.id;
  const idCarga = raw.id_carga;
  if (typeof id !== 'number' || typeof idCarga !== 'number') return null;

  return {
    id,
    id_carga: idCarga,
    temperatura: raw.temperatura as number | string,
    latitude: (raw.latitude ?? null) as number | string | null,
    longitude: (raw.longitude ?? null) as number | string | null,
    created_at: String(raw.created_at ?? ''),
    carga: null,
  };
}
