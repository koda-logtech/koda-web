export type TempStatus = 'ok' | 'warn' | 'crit';

/** Largura da banda de "proximidade do limite" como fração do intervalo permitido. */
export const TEMP_STATUS_BAND_FRACTION = 0.1;

export function getTempStatus(atual: number, min: number, max: number): TempStatus {
  if (atual < min || atual > max) return 'crit';
  const span = max - min;
  if (span <= 0) return 'ok';
  const margin = span * TEMP_STATUS_BAND_FRACTION;
  if (atual < min + margin || atual > max - margin) return 'warn';
  return 'ok';
}
