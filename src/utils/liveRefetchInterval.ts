/** Intervalo de polling legado quando Realtime não está saudável. */
export function liveRefetchInterval(
  baseMs: number,
  realtimeHealthy: boolean,
): number | false {
  return realtimeHealthy ? false : baseMs;
}
