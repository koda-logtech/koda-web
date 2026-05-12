import type { EntregaCompleta } from '@/types/models';
import { entregaTemCoordsParaMapa } from '@/utils/entregaMap';

/** Intervalo de polling para dashboard e monitoramento (entregas / armazéns). */
export const DASHBOARD_LIVE_REFETCH_MS = 15_000;

export const STATUS_ATIVOS = new Set(['pendente', 'em_transito', 'no_armazem']);

const DEZ_MIN_MS = 10 * 60 * 1000;

export function parseTemp(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

export function tempKind(
  atual: number | null,
  min: number | null,
  max: number | null,
): 'none' | 'neutral' | 'warn' | 'danger' {
  if (atual === null) return 'none';
  if (min === null || max === null) return 'neutral';
  if (atual < min || atual > max) return 'danger';
  const span = max - min;
  if (span <= 0) return 'neutral';
  const band = span * 0.15;
  if (atual <= min + band || atual >= max - band) return 'warn';
  return 'neutral';
}

export function formatMetricKpi(n: number): string {
  if (!Number.isFinite(n) || n < 0) return '00';
  if (n < 10) return String(n).padStart(2, '0');
  return String(n);
}

/** Sem telemetria ou última leitura há mais de 10 minutos. */
export function entregaDesconectada(
  e: EntregaCompleta,
  nowMs: number = Date.now(),
): boolean {
  const ua = e.ultima_auditoria_at;
  if (ua == null || ua === '') return true;
  const t = Date.parse(ua);
  if (!Number.isFinite(t)) return true;
  return nowMs - t > DEZ_MIN_MS;
}

export function computeOperationKpis(entregas: EntregaCompleta[], nowMs: number = Date.now()) {
  const ativas = entregas.filter((e) => STATUS_ATIVOS.has(e.status));

  const liveTrips = entregas.filter(
    (e) => STATUS_ATIVOS.has(e.status) && entregaTemCoordsParaMapa(e),
  );

  const emTransito = liveTrips.length;

  const riscoTermico = ativas.filter((e) => {
    const tk = tempKind(
      parseTemp(e.temperatura_atual),
      parseTemp(e.temperatura_minima),
      parseTemp(e.temperatura_maxima),
    );
    return tk === 'danger';
  }).length;

  const desconectados = ativas.filter((e) => entregaDesconectada(e, nowMs)).length;

  return {
    emTransito,
    riscoTermico,
    desconectados,
    /** Mantido mock conforme pedido de produto. */
    alertasAtivos: 1,
  };
}
