import type { CargaTelemetriaAuditoria, MultiLineStringGeometry } from '@/types/models';
import { parseCoord } from '@/utils/entregaMap';

function isValidLngLat(lon: number, lat: number): boolean {
  return Math.abs(lat) <= 90 && Math.abs(lon) <= 180;
}

function sameCoord(a: [number, number], b: [number, number]): boolean {
  return a[0] === b[0] && a[1] === b[1];
}

/**
 * Monta um GeoJSON MultiLineString com todos os pings válidos da auditoria,
 * em ordem cronológica, sem limite de pontos. Quebras de GPS (coord nula)
 * iniciam um novo segmento de linha.
 */
export function buildCargaTraveledRoute(
  rows: CargaTelemetriaAuditoria[],
): MultiLineStringGeometry | null {
  const lines: [number, number][][] = [];
  let current: [number, number][] = [];

  const flush = () => {
    if (current.length >= 2) {
      lines.push(current);
    }
    current = [];
  };

  for (const row of rows) {
    const lon = parseCoord(row.longitude);
    const lat = parseCoord(row.latitude);
    if (lon === null || lat === null || !isValidLngLat(lon, lat)) {
      flush();
      continue;
    }

    const coord: [number, number] = [lon, lat];
    const last = current[current.length - 1];
    if (last && sameCoord(last, coord)) continue;
    current.push(coord);
  }

  flush();

  if (lines.length === 0) return null;
  return { type: 'MultiLineString', coordinates: lines };
}

/** Todas as coordenadas [lng, lat] do MultiLineString (para fitBounds). */
export function flattenMultiLineCoordinates(
  geometry: MultiLineStringGeometry,
): [number, number][] {
  return geometry.coordinates.flat();
}
