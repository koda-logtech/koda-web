import type { EntregaCompleta } from '@/types/models';

export function parseCoord(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

export function entregaTemCoordsParaMapa(e: EntregaCompleta): boolean {
  const la = parseCoord(e.latitude_carga);
  const lo = parseCoord(e.longitude_carga);
  const lda = parseCoord(e.latitude_cliente);
  const ldo = parseCoord(e.longitude_cliente);
  if (la === null || lo === null || lda === null || ldo === null) return false;
  return (
    Math.abs(la) <= 90 &&
    Math.abs(lda) <= 90 &&
    Math.abs(lo) <= 180 &&
    Math.abs(ldo) <= 180
  );
}
