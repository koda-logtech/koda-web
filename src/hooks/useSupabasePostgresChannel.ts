import { useEffect, useRef, useState } from 'react';
import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from '@/lib/supabaseBrowser';

export type PostgresChangeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

export interface PostgresChangeBinding {
  event: PostgresChangeEvent;
  schema?: string;
  table: string;
  filter?: string;
}

export interface UseSupabasePostgresChannelOptions<T extends Record<string, unknown>> {
  channelName: string;
  enabled?: boolean;
  bindings: PostgresChangeBinding[];
  /** Debounce em ms para agrupar rajadas de eventos (default 200). */
  debounceMs?: number;
  onPayload: (payload: RealtimePostgresChangesPayload<T>) => void;
  /** Chamado uma vez após debounce com todos os payloads acumulados. */
  onBatch?: (payloads: RealtimePostgresChangesPayload<T>[]) => void;
}

const HEALTHY_STATUSES = new Set(['SUBSCRIBED']);

/**
 * Assina postgres_changes com cleanup e indicador de saúde para fallback de polling.
 */
export function useSupabasePostgresChannel<T extends Record<string, unknown> = Record<string, unknown>>(
  options: UseSupabasePostgresChannelOptions<T>,
): { isRealtimeHealthy: boolean } {
  const {
    channelName,
    enabled = true,
    bindings,
    debounceMs = 200,
    onPayload,
    onBatch,
  } = options;

  const [isRealtimeHealthy, setIsRealtimeHealthy] = useState(false);

  const onPayloadRef = useRef(onPayload);
  const onBatchRef = useRef(onBatch);
  onPayloadRef.current = onPayload;
  onBatchRef.current = onBatch;

  const bindingsKey = JSON.stringify(bindings);

  useEffect(() => {
    if (!enabled) {
      setIsRealtimeHealthy(false);
      return undefined;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setIsRealtimeHealthy(false);
      return undefined;
    }

    let cancelled = false;
    let channel: RealtimeChannel | null = null;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const batch: RealtimePostgresChangesPayload<T>[] = [];

    const flushBatch = () => {
      if (batch.length === 0) return;
      const copy = batch.splice(0, batch.length);
      onBatchRef.current?.(copy);
    };

    const scheduleFlush = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        debounceTimer = null;
        if (!cancelled) flushBatch();
      }, debounceMs);
    };

    channel = supabase.channel(channelName);

    const activeBindings = JSON.parse(bindingsKey) as PostgresChangeBinding[];
    for (const binding of activeBindings) {
      channel = channel.on(
        'postgres_changes',
        {
          event: binding.event,
          schema: binding.schema ?? 'public',
          table: binding.table,
          filter: binding.filter,
        },
        (payload) => {
          if (cancelled) return;
          onPayloadRef.current(payload as RealtimePostgresChangesPayload<T>);
          batch.push(payload as RealtimePostgresChangesPayload<T>);
          scheduleFlush();
        },
      );
    }

    channel.subscribe((status) => {
      if (cancelled) return;
      setIsRealtimeHealthy(HEALTHY_STATUSES.has(status));
    });

    return () => {
      cancelled = true;
      if (debounceTimer) clearTimeout(debounceTimer);
      batch.length = 0;
      setIsRealtimeHealthy(false);
      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, [channelName, enabled, debounceMs, bindingsKey]);

  return { isRealtimeHealthy };
}
