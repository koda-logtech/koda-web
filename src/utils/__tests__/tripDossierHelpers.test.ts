import { describe, expect, it } from 'vitest';
import type { CargaAlerta, CargaTelemetriaAuditoria, EntregaCompleta } from '@/types/models';
import {
  buildFreightIdentifier,
  computeTelemetryStats,
  escapeCsvField,
  formatCsvRow,
  parseTelemetryNumber,
  resolveComplianceStatus,
} from '../tripDossierHelpers';

const baseEntrega: EntregaCompleta = {
  id: 12,
  id_caminhao: 1,
  id_cliente: 2,
  status: 'entregue',
  created_at: '',
  updated_at: '',
  placa_caminhao: 'ABC1D23',
  nome_cliente: 'Cliente X',
  nome_motorista: 'João',
  endereco_cliente: null,
  temperatura_atual: null,
  temperatura_maxima: 8,
  temperatura_minima: 2,
  id_carga: 34,
};

function ping(
  overrides: Partial<CargaTelemetriaAuditoria> & Pick<CargaTelemetriaAuditoria, 'id' | 'temperatura'>,
): CargaTelemetriaAuditoria {
  return {
    id_carga: 34,
    latitude: -23.5,
    longitude: -46.6,
    created_at: '2026-01-01T12:00:00.000Z',
    carga: null,
    ...overrides,
  };
}

function alerta(overrides: Partial<CargaAlerta>): CargaAlerta {
  return {
    id: 1,
    id_carga: 34,
    tipo: 'alta',
    status: 'resolvido',
    limite_minimo: 2,
    limite_maximo: 8,
    temperatura_inicio: 9,
    temperatura_pico: 10,
    temperatura_fim: 7,
    qtd_pings: 3,
    aberto_telemetria_id: 1,
    resolvido_telemetria_id: 2,
    aberto_at: '2026-01-01T12:00:00.000Z',
    resolvido_at: '2026-01-01T12:30:00.000Z',
    created_at: '',
    updated_at: '',
    carga: null,
    ...overrides,
  };
}

describe('parseTelemetryNumber', () => {
  it('parses comma decimals', () => {
    expect(parseTelemetryNumber('4,5')).toBe(4.5);
  });

  it('returns null for empty', () => {
    expect(parseTelemetryNumber('')).toBeNull();
  });
});

describe('computeTelemetryStats', () => {
  it('computes min/max and out-of-range', () => {
    const pings = [
      ping({ id: 1, temperatura: 5 }),
      ping({ id: 2, temperatura: 9 }),
      ping({ id: 3, temperatura: 3 }),
    ];
    const stats = computeTelemetryStats(pings, 4, 8);
    expect(stats.totalPings).toBe(3);
    expect(stats.tempMin).toBe(3);
    expect(stats.tempMax).toBe(9);
    expect(stats.hadOutOfRangePing).toBe(true);
  });

  it('marks in-range when limits null', () => {
    const pings = [ping({ id: 1, temperatura: 100 })];
    const stats = computeTelemetryStats(pings, null, null);
    expect(stats.hadOutOfRangePing).toBe(false);
  });
});

describe('resolveComplianceStatus', () => {
  it('returns conforme without alerts or out-of-range', () => {
    const stats = computeTelemetryStats([ping({ id: 1, temperatura: 5 })], 2, 8);
    expect(resolveComplianceStatus(stats, [])).toBe('conforme');
  });

  it('returns risco when alert is not canceled', () => {
    const stats = computeTelemetryStats([ping({ id: 1, temperatura: 5 })], 2, 8);
    expect(resolveComplianceStatus(stats, [alerta({ status: 'aberto' })])).toBe('risco');
  });

  it('returns conforme when only canceled alerts', () => {
    const stats = computeTelemetryStats([ping({ id: 1, temperatura: 5 })], 2, 8);
    expect(resolveComplianceStatus(stats, [alerta({ status: 'cancelado' })])).toBe('conforme');
  });
});

describe('buildFreightIdentifier', () => {
  it('includes entrega, carga and placa', () => {
    expect(buildFreightIdentifier(baseEntrega)).toBe('Entrega #12 · Carga #34 · Placa ABC1D23');
  });
});

describe('csv escaping', () => {
  it('quotes fields with commas', () => {
    expect(escapeCsvField('a,b')).toBe('"a,b"');
  });

  it('formats a row', () => {
    expect(formatCsvRow([1, '2026-01-01', null, 'x,y'])).toBe('1,2026-01-01,,"x,y"');
  });
});
