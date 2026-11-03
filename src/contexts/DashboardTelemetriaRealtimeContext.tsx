import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSupabasePostgresChannel } from '@/hooks/useSupabasePostgresChannel';
import {
  appendTelemetriaPingToCache,
  invalidateEntregasCompleto,
  mapRealtimeRowToTelemetriaAuditoria,
} from '@/utils/realtimeQueryUpdates';

interface DashboardTelemetriaRealtimeContextValue {
  isRealtimeHealthy: boolean;
  /** Registra a carga selecionada no mapa (Overview ou Monitoramento). */
  setSelectedCargaId: (id: number | null) => void;
}

const DashboardTelemetriaRealtimeContext = createContext<
  DashboardTelemetriaRealtimeContextValue | undefined
>(undefined);

interface ProviderProps {
  children: ReactNode;
  enabled?: boolean;
}

export function DashboardTelemetriaRealtimeProvider({
  children,
  enabled = true,
}: ProviderProps) {
  const queryClient = useQueryClient();
  const selectedCargaIdRef = useRef<number | null>(null);

  const setSelectedCargaId = useCallback((id: number | null) => {
    selectedCargaIdRef.current = id;
  }, []);

  const { isRealtimeHealthy } = useSupabasePostgresChannel({
    channelName: 'koda-web:carga_telemetria_auditoria',
    enabled,
    bindings: [{ event: 'INSERT', table: 'carga_telemetria_auditoria' }],
    onPayload: () => {},
    onBatch: (payloads) => {
      invalidateEntregasCompleto(queryClient);

      const selectedId = selectedCargaIdRef.current;
      if (selectedId == null || selectedId <= 0) return;

      for (const payload of payloads) {
        if (payload.eventType !== 'INSERT' || !payload.new) continue;
        const row = mapRealtimeRowToTelemetriaAuditoria(
          payload.new as Record<string, unknown>,
        );
        if (row && row.id_carga === selectedId) {
          appendTelemetriaPingToCache(queryClient, selectedId, row);
        }
      }
    },
  });

  const value = useMemo(
    () => ({ isRealtimeHealthy, setSelectedCargaId }),
    [isRealtimeHealthy, setSelectedCargaId],
  );

  return (
    <DashboardTelemetriaRealtimeContext.Provider value={value}>
      {children}
    </DashboardTelemetriaRealtimeContext.Provider>
  );
}

export function useDashboardTelemetriaRealtime(): DashboardTelemetriaRealtimeContextValue {
  const ctx = useContext(DashboardTelemetriaRealtimeContext);
  if (!ctx) {
    throw new Error(
      'useDashboardTelemetriaRealtime deve ser usado dentro de <DashboardTelemetriaRealtimeProvider>',
    );
  }
  return ctx;
}
