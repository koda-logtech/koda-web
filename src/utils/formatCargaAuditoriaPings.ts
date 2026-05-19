import type { CargaTelemetriaAuditoria } from "@/types/models";

function parseNum(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function formatWhen(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return iso;
  }
}

/** Uma linha por ping, ordem cronológica (mais antigo → mais recente). */
export function formatCargaAuditoriaMultiline(rows: CargaTelemetriaAuditoria[]): string {
  if (rows.length === 0) {
    return "Nenhum ping de telemetria na auditoria desta carga.";
  }

  return rows
    .map((row) => {
      const t = parseNum(row.temperatura);
      const lat = parseNum(row.latitude);
      const lon = parseNum(row.longitude);
      const tempStr = t === null ? "—" : `${t.toFixed(1)}°C`;
      const coords =
        lat !== null && lon !== null ? `${lat.toFixed(5)}, ${lon.toFixed(5)}` : "—";
      return `${formatWhen(row.created_at)} · ${tempStr} · ${coords}`;
    })
    .join("\n");
}
