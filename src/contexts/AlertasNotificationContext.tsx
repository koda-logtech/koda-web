import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  ALERTAS_LIVE_REFETCH_MS,
  useAlertas,
} from '@controllers/alertaController';
import { alertaService } from '@services/alertaService';
import { useSupabasePostgresChannel } from '@/hooks/useSupabasePostgresChannel';
import { liveRefetchInterval } from '@/utils/liveRefetchInterval';
import type { CargaAlerta, CargaAlertaStatus } from '@/types/models';

interface AlertasNotificationContextValue {
  /** Alertas atualmente abertos no servidor (lista exibida no sininho). */
  alertasAbertos: CargaAlerta[];
  /** Quantidade — usada para badge. */
  totalAbertos: number;
  /** Fila de alertas novos ainda não dispensados pelo usuário (modal). */
  pendingNewAlerts: CargaAlerta[];
  /** Dispensa apenas o primeiro da fila (continua aparecendo se houver mais). */
  dismissCurrentNewAlert: () => void;
  /** Dispensa toda a fila. */
  dismissAllNewAlerts: () => void;
  /** Canal Realtime de alertas ativo (fallback = polling). */
  isAlertasRealtimeHealthy: boolean;
}

const AlertasNotificationContext = createContext<
  AlertasNotificationContextValue | undefined
>(undefined);

/** Storage key — IDs já apresentados em modal nesta sessão. */
const SEEN_STORAGE_KEY = 'kodaweb.alertas.seenModalIds.v1';

function loadSeenIds(): Set<number> {
  try {
    const raw = sessionStorage.getItem(SEEN_STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.filter((x) => typeof x === 'number'));
  } catch {
    return new Set();
  }
}

function persistSeenIds(ids: Set<number>) {
  try {
    sessionStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(Array.from(ids)));
  } catch {
    /* ignore quota errors */
  }
}

/**
 * Beep curto via Web Audio API — sem assets externos.
 * É chamado dentro de um handler de detecção; navegadores podem bloquear
 * antes da primeira interação do usuário (silently no-op nesse caso).
 */
function playAlertBeep() {
  try {
    const AudioCtx =
      (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
        .AudioContext ||
      (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(880, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.35);
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.55);
    o.onended = () => ctx.close().catch(() => {});
  } catch {
    /* ignore */
  }
}

interface ProviderProps {
  children: ReactNode;
  /** Quando desligado, o provider não faz polling (ex.: usuário deslogado). */
  enabled?: boolean;
}

export function AlertasNotificationProvider({ children, enabled = true }: ProviderProps) {
  const queryClient = useQueryClient();
  const seenIdsRef = useRef<Set<number>>(loadSeenIds());
  const isFirstLoadRef = useRef(true);
  const [pendingNewAlerts, setPendingNewAlerts] = useState<CargaAlerta[]>([]);

  const queueAlertIfNew = useCallback(
    (alert: CargaAlerta) => {
      if (!enabled || alert.status !== 'aberto') return;

      const seen = seenIdsRef.current;

      if (isFirstLoadRef.current) {
        seen.add(alert.id);
        persistSeenIds(seen);
        return;
      }

      if (seen.has(alert.id)) return;

      setPendingNewAlerts((prev) => {
        if (prev.some((p) => p.id === alert.id)) return prev;
        return [...prev, alert];
      });
      seen.add(alert.id);
      persistSeenIds(seen);
      playAlertBeep();
    },
    [enabled],
  );

  const queueAlertIfNewRef = useRef(queueAlertIfNew);
  queueAlertIfNewRef.current = queueAlertIfNew;

  const { isRealtimeHealthy: isAlertasRealtimeHealthy } = useSupabasePostgresChannel({
    channelName: 'koda-web:carga_alertas',
    enabled,
    bindings: [
      { event: 'INSERT', table: 'carga_alertas' },
      { event: 'UPDATE', table: 'carga_alertas' },
    ],
    onPayload: () => {},
    onBatch: (payloads) => {
      void queryClient.invalidateQueries({ queryKey: ['alertas'] });

      for (const payload of payloads) {
        const row = payload.new as Record<string, unknown> | undefined;
        if (!row || typeof row.id !== 'number') continue;
        const status = row.status as CargaAlertaStatus | undefined;
        const oldStatus = (payload.old as Record<string, unknown> | undefined)?.status;
        const shouldNotify =
          status === 'aberto' &&
          (payload.eventType === 'INSERT' ||
            (payload.eventType === 'UPDATE' && oldStatus !== 'aberto'));

        if (!shouldNotify) continue;

        void alertaService
          .getById(row.id)
          .then((full) => {
            queueAlertIfNewRef.current(full);
          })
          .catch(() => {});
      }
    },
  });

  const { data = [] } = useAlertas(
    { status: 'aberto', page: 1, limit: 100 },
    {
      enabled,
      staleTime: 0,
      refetchInterval: enabled
        ? liveRefetchInterval(ALERTAS_LIVE_REFETCH_MS, isAlertasRealtimeHealthy)
        : false,
      refetchIntervalInBackground: true,
      refetchOnWindowFocus: true,
    },
  );

  const alertasAbertos = data as CargaAlerta[];

  useEffect(() => {
    if (!enabled) return;

    const currentIds = new Set(alertasAbertos.map((a) => a.id));

    const seen = seenIdsRef.current;
    let seenChanged = false;
    for (const id of Array.from(seen)) {
      if (!currentIds.has(id)) {
        seen.delete(id);
        seenChanged = true;
      }
    }

    if (isFirstLoadRef.current) {
      for (const id of currentIds) seen.add(id);
      seenChanged = true;
      isFirstLoadRef.current = false;
    } else if (!isAlertasRealtimeHealthy) {
      const novos = alertasAbertos.filter((a) => !seen.has(a.id));
      if (novos.length > 0) {
        setPendingNewAlerts((prev) => {
          const prevIds = new Set(prev.map((p) => p.id));
          const adicionais = novos.filter((n) => !prevIds.has(n.id));
          return adicionais.length > 0 ? [...prev, ...adicionais] : prev;
        });
        for (const n of novos) seen.add(n.id);
        seenChanged = true;
        playAlertBeep();
      }
    }

    if (seenChanged) persistSeenIds(seen);
  }, [alertasAbertos, enabled, isAlertasRealtimeHealthy]);

  useEffect(() => {
    setPendingNewAlerts((prev) => {
      if (prev.length === 0) return prev;
      const stillOpen = new Set(alertasAbertos.map((a) => a.id));
      const filtered = prev.filter((p) => stillOpen.has(p.id));
      return filtered.length === prev.length ? prev : filtered;
    });
  }, [alertasAbertos]);

  const dismissCurrentNewAlert = useCallback(() => {
    setPendingNewAlerts((prev) => (prev.length > 0 ? prev.slice(1) : prev));
  }, []);

  const dismissAllNewAlerts = useCallback(() => {
    setPendingNewAlerts([]);
  }, []);

  const value = useMemo<AlertasNotificationContextValue>(
    () => ({
      alertasAbertos,
      totalAbertos: alertasAbertos.length,
      pendingNewAlerts,
      dismissCurrentNewAlert,
      dismissAllNewAlerts,
      isAlertasRealtimeHealthy,
    }),
    [
      alertasAbertos,
      pendingNewAlerts,
      dismissCurrentNewAlert,
      dismissAllNewAlerts,
      isAlertasRealtimeHealthy,
    ],
  );

  return (
    <AlertasNotificationContext.Provider value={value}>
      {children}
    </AlertasNotificationContext.Provider>
  );
}

export function useAlertasNotifications(): AlertasNotificationContextValue {
  const ctx = useContext(AlertasNotificationContext);
  if (!ctx) {
    throw new Error(
      'useAlertasNotifications deve ser usado dentro de <AlertasNotificationProvider>',
    );
  }
  return ctx;
}
