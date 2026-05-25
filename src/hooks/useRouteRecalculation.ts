import { useEffect, useRef } from "react";
import type { LineStringGeometry } from "@/types/models";
import { pointToLineStringDistanceMeters } from "@/utils/routeDistance";

/** Caminhão a mais de N metros da rota → desvio detectado. */
export const ROUTE_RECALC_DISTANCE_METERS = 150;
/** Recalcular forçado a cada N atualizações reais de posição (proteção contra drift acumulado). */
export const ROUTE_RECALC_EVERY_N_PINGS = 5;
/** Cooldown mínimo entre dois refetches consecutivos (evita rajada quando ambos os gatilhos disparam). */
const RECALC_COOLDOWN_MS = 5_000;

export interface RouteRecalculationOptions {
  /** ID da entrega atualmente selecionada (`null` quando nada selecionado). */
  selectedEntregaId: number | null;
  /** Coordenada atual da carga em `[lng, lat]` (`null` quando indisponível). */
  cargaLngLat: readonly [number, number] | null;
  /** Geometria atualmente desenhada — `null` enquanto a primeira rota carrega. */
  routeGeometry: LineStringGeometry | null;
  /** Função para refazer a rota (normalmente `directionQuery.refetch`). */
  refetch: () => unknown;
  /** Permite sobrescrever os limiares em testes ou em ambientes diferentes. */
  thresholdMeters?: number;
  everyNPings?: number;
}

/**
 * Observa a posição da carga selecionada e o traçado atual da rota. Dispara
 * `refetch()` quando:
 *
 * 1. **Desvio**: caminhão está a mais de `thresholdMeters` da polilinha desenhada.
 * 2. **Drift acumulado**: já se passaram `everyNPings` atualizações reais de
 *    posição desde o último cálculo (evita que pequenos desvios consecutivos
 *    deixem a rota muito desatualizada sem nunca disparar a condição 1).
 *
 * O hook respeita um cooldown interno (`RECALC_COOLDOWN_MS`) para nunca disparar
 * dois refetches em sequência muito próximos.
 */
export function useRouteRecalculation({
  selectedEntregaId,
  cargaLngLat,
  routeGeometry,
  refetch,
  thresholdMeters = ROUTE_RECALC_DISTANCE_METERS,
  everyNPings = ROUTE_RECALC_EVERY_N_PINGS,
}: RouteRecalculationOptions): void {
  const lastEntregaIdRef = useRef<number | null>(null);
  const lastCargaPosRef = useRef<readonly [number, number] | null>(null);
  const pingsSinceLastRecalcRef = useRef(0);
  const lastRecalcAtRef = useRef(0);

  useEffect(() => {
    // Troca de entrega selecionada (ou desseleção): zera estado.
    if (lastEntregaIdRef.current !== selectedEntregaId) {
      lastEntregaIdRef.current = selectedEntregaId;
      lastCargaPosRef.current = null;
      pingsSinceLastRecalcRef.current = 0;
      lastRecalcAtRef.current = 0;
    }
    if (selectedEntregaId === null) return;
    if (!cargaLngLat) return;
    if (!routeGeometry || routeGeometry.coordinates.length < 2) return;

    const [lng, lat] = cargaLngLat;
    const prev = lastCargaPosRef.current;

    // Considera "atualização real" apenas quando a posição muda.
    if (!prev || prev[0] !== lng || prev[1] !== lat) {
      lastCargaPosRef.current = [lng, lat];
      pingsSinceLastRecalcRef.current += 1;
    } else {
      // Re-render sem mudança de coord (rota acabou de ser refetched, por ex.)
      // → não conta como ping.
      return;
    }

    const now = Date.now();
    if (now - lastRecalcAtRef.current < RECALC_COOLDOWN_MS) return;

    const distM = pointToLineStringDistanceMeters(
      lng,
      lat,
      routeGeometry.coordinates,
    );

    const tooFar = distM > thresholdMeters;
    const tooOld = pingsSinceLastRecalcRef.current >= everyNPings;

    if (tooFar || tooOld) {
      lastRecalcAtRef.current = now;
      pingsSinceLastRecalcRef.current = 0;
      refetch();
    }
  }, [
    selectedEntregaId,
    cargaLngLat,
    routeGeometry,
    refetch,
    thresholdMeters,
    everyNPings,
  ]);
}
