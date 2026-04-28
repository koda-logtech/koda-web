export type TempStatus = 'ok' | 'warn' | 'crit';

export function getTempStatus(atual: number, min: number, max: number): TempStatus {
  if (atual < min || atual > max) return 'crit';
  const span = max - min;
  const margin = span * 0.15;
  if (atual < min + margin || atual > max - margin) return 'warn';
  return 'ok';
}
