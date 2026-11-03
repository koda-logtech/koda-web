import type { CargaAlerta, CargaTelemetriaAuditoria, EntregaCompleta } from '@/types/models';

export type TripComplianceKind = 'conforme' | 'risco';

export type TelemetryStats = {
  totalPings: number;
  tempMin: number | null;
  tempMax: number | null;
  hadOutOfRangePing: boolean;
};

export function parseTelemetryNumber(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

export function computeTelemetryStats(
  pings: CargaTelemetriaAuditoria[],
  tMin: number | null,
  tMax: number | null,
): TelemetryStats {
  let tempMin: number | null = null;
  let tempMax: number | null = null;
  let hadOutOfRangePing = false;

  for (const row of pings) {
    const temp = parseTelemetryNumber(row.temperatura);
    if (temp === null) continue;

    if (tempMin === null || temp < tempMin) tempMin = temp;
    if (tempMax === null || temp > tempMax) tempMax = temp;

    if (tMin !== null && tMax !== null && (temp < tMin || temp > tMax)) {
      hadOutOfRangePing = true;
    }
  }

  return {
    totalPings: pings.length,
    tempMin,
    tempMax,
    hadOutOfRangePing,
  };
}

export function resolveComplianceStatus(
  stats: TelemetryStats,
  alertas: CargaAlerta[],
): TripComplianceKind {
  const hasRelevantAlert = alertas.some((a) => a.status !== 'cancelado');
  if (hasRelevantAlert || stats.hadOutOfRangePing) {
    return 'risco';
  }
  return 'conforme';
}

export function buildFreightIdentifier(entrega: EntregaCompleta): string {
  const parts: string[] = [`Entrega #${entrega.id}`];
  const idCarga = entrega.id_carga;
  if (idCarga != null && idCarga > 0) {
    parts.push(`Carga #${idCarga}`);
  }
  const placa = entrega.placa_caminhao?.trim();
  if (placa) {
    parts.push(`Placa ${placa}`);
  }
  return parts.join(' · ');
}

export function escapeCsvField(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function formatCsvRow(fields: (string | number | null | undefined)[]): string {
  return fields.map(escapeCsvField).join(',');
}

export function downloadTextFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function yieldToMain(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

export function formatTimestampForFilename(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}`;
}
