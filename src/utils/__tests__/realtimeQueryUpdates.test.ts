import { describe, expect, it } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import type { CargaTelemetriaAuditoria } from '@/types/models';
import {
  appendTelemetriaPingToCache,
  mapRealtimeRowToTelemetriaAuditoria,
  telemetriaPorCargaQueryKey,
} from '@/utils/realtimeQueryUpdates';

describe('mapRealtimeRowToTelemetriaAuditoria', () => {
  it('mapeia payload mínimo do Realtime', () => {
    const row = mapRealtimeRowToTelemetriaAuditoria({
      id: 1,
      id_carga: 9,
      temperatura: -18.5,
      latitude: -23.5,
      longitude: -46.6,
      created_at: '2026-01-01T12:00:00Z',
    });
    expect(row).toMatchObject({ id: 1, id_carga: 9, created_at: '2026-01-01T12:00:00Z' });
  });

  it('retorna null sem id numérico', () => {
    expect(mapRealtimeRowToTelemetriaAuditoria({ id_carga: 1 })).toBeNull();
  });
});

describe('appendTelemetriaPingToCache', () => {
  it('deduplica por id e ordena por created_at', () => {
    const qc = new QueryClient();
    const key = telemetriaPorCargaQueryKey(42);
    const a: CargaTelemetriaAuditoria = {
      id: 1,
      id_carga: 42,
      temperatura: 1,
      latitude: 0,
      longitude: 0,
      created_at: '2026-01-01T10:00:00Z',
      carga: null,
    };
    const b: CargaTelemetriaAuditoria = {
      ...a,
      id: 2,
      created_at: '2026-01-01T11:00:00Z',
    };

    qc.setQueryData(key, [b]);
    appendTelemetriaPingToCache(qc, 42, a);
    appendTelemetriaPingToCache(qc, 42, b);

    const list = qc.getQueryData<CargaTelemetriaAuditoria[]>(key);
    expect(list?.map((r) => r.id)).toEqual([1, 2]);
  });
});
