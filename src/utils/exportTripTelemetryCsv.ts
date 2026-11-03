import type { CargaTelemetriaAuditoria } from '@/types/models';
import {
  downloadTextFile,
  formatCsvRow,
  formatTimestampForFilename,
  parseTelemetryNumber,
} from './tripDossierHelpers';

export interface ExportTripTelemetryCsvOptions {
  pings: CargaTelemetriaAuditoria[];
  idCarga: number;
  generatedAtMs?: number;
}

const CSV_HEADER = 'id_leitura,timestamp,temperatura,latitude,longitude';
const CSV_MIME = 'text/csv;charset=utf-8';

function sortPingsAsc(pings: CargaTelemetriaAuditoria[]): CargaTelemetriaAuditoria[] {
  return [...pings].sort(
    (a, b) => Date.parse(a.created_at) - Date.parse(b.created_at) || a.id - b.id,
  );
}

/** Gera e baixa CSV UTF-8 com a série temporal bruta da viagem. */
export function exportTripTelemetryCsv(options: ExportTripTelemetryCsvOptions): void {
  const { pings, idCarga } = options;
  const generatedAtMs = options.generatedAtMs ?? Date.now();
  const sorted = sortPingsAsc(pings);

  const lines = [CSV_HEADER];
  for (const row of sorted) {
    const temp = parseTelemetryNumber(row.temperatura);
    const lat = parseTelemetryNumber(row.latitude);
    const lon = parseTelemetryNumber(row.longitude);
    lines.push(
      formatCsvRow([
        row.id,
        row.created_at,
        temp === null ? '' : temp,
        lat === null ? '' : lat,
        lon === null ? '' : lon,
      ]),
    );
  }

  const filename = `koda-telemetria-carga-${idCarga}-${formatTimestampForFilename(generatedAtMs)}.csv`;
  downloadTextFile(filename, lines.join('\n'), CSV_MIME);
}
