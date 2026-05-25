import { useEffect, useMemo, useState } from "react";
import ContentHeader from "./ContentHeader";
import Loading from "@components/common/Loading";
import { useTelemetriaAuditoria } from "@controllers/cargaController";
import type { CargaTelemetriaAuditoria } from "@/types/models";

import "./Management.css";
import "./Trips.css";

const PAGE_SIZE = 10;
const FETCH_LIMIT = 300;

function unwrapCarga(
  c: CargaTelemetriaAuditoria["carga"],
): { id: number; tipo: string } | null {
  if (c == null) return null;
  if (Array.isArray(c)) return c[0] ?? null;
  return c;
}

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

export default function Audit() {
  const { data: rawRows = [], isLoading, isError, refetch } = useTelemetriaAuditoria(1, FETCH_LIMIT);
  const rows = rawRows as CargaTelemetriaAuditoria[];

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => {
      const c = unwrapCarga(row.carga);
      const tipo = c?.tipo?.trim().toLowerCase() ?? "";
      const idC = String(row.id_carga ?? "");
      const idReg = String(row.id ?? "");
      return tipo.includes(q) || idC.includes(q) || idReg.includes(q);
    });
  }, [rows, search]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const sliceFrom = (safePage - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(sliceFrom, sliceFrom + PAGE_SIZE);
  const rangeEnd = total === 0 ? 0 : Math.min(sliceFrom + PAGE_SIZE, total);

  const pageNumbers = useMemo(() => {
    const maxBtns = 5;
    let start = Math.max(1, safePage - Math.floor(maxBtns / 2));
    const end = Math.min(totalPages, start + maxBtns - 1);
    start = Math.max(1, end - maxBtns + 1);
    const nums: number[] = [];
    for (let i = start; i <= end; i++) nums.push(i);
    return nums;
  }, [safePage, totalPages]);

  return (
    <div className="dashboard-page trips-page">
      <ContentHeader
        title="Auditoria"
        subtitle="Registos de telemetria por carga — atualização em tempo quase real."
      />

      <div className="page-content">
        <section className="trips-toolbar" aria-label="Filtros">
          <div className="trips-toolbar-fields">
            <div className="trips-search-row">
              <svg
                className="trips-search-icon"
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="search"
                className="trips-search-input"
                placeholder="Tipo da carga, id da carga ou id do registo…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Busca"
              />
            </div>
          </div>

          <aside className="trips-metric-card">
            <span className="trips-metric-label">Registos carregados</span>
            <span className="trips-metric-value">{rows.length}</span>
            <span className="trips-metric-hint">Até {FETCH_LIMIT} mais recentes · atualização automática a cada 5 s</span>
          </aside>
        </section>

        {isError ? (
          <div
            className="table-container"
            style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}
          >
            <p>Não foi possível carregar a auditoria.</p>
            <button type="button" className="trips-page-btn" onClick={() => refetch()}>
              Tentar novamente
            </button>
          </div>
        ) : (
          <div className="table-container">
            {isLoading ? (
              <Loading message="Carregando telemetria…" />
            ) : (
              <>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Data / hora</th>
                      <th>Carga</th>
                      <th>Temperatura</th>
                      <th>Latitude</th>
                      <th>Longitude</th>
                      <th>Id registo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((row) => {
                      const c = unwrapCarga(row.carga);
                      const tipo = c?.tipo?.trim() ? c.tipo : "—";
                      const idCarga = row.id_carga;
                      const t = parseNum(row.temperatura);
                      const lat = parseNum(row.latitude);
                      const lon = parseNum(row.longitude);

                      return (
                        <tr key={row.id}>
                          <td>
                            <span className="cell-sub-text">{formatWhen(row.created_at)}</span>
                          </td>
                          <td>
                            <span className="cell-main-text">{tipo}</span>
                            <span className="cell-sub-text" style={{ display: "block", marginTop: 4 }}>
                              Carga #{idCarga}
                            </span>
                          </td>
                          <td>
                            {t === null ? (
                              <span className="cell-sub-text">—</span>
                            ) : (
                              <span className="cell-main-text">{t.toFixed(1)}°C</span>
                            )}
                          </td>
                          <td>
                            <span className="cell-sub-text">
                              {lat === null ? "—" : lat.toFixed(5)}
                            </span>
                          </td>
                          <td>
                            <span className="cell-sub-text">
                              {lon === null ? "—" : lon.toFixed(5)}
                            </span>
                          </td>
                          <td>
                            <span className="cell-sub-text">#{row.id}</span>
                          </td>
                        </tr>
                      );
                    })}
                    {pageRows.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          style={{
                            textAlign: "center",
                            padding: "3rem",
                            color: "var(--text-secondary)",
                          }}
                        >
                          {rows.length === 0
                            ? "Nenhum registo de telemetria encontrado."
                            : "Nenhum resultado com os filtros atuais."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {total > 0 && (
                  <div className="trips-pagination">
                    <span>
                      Exibindo {sliceFrom + 1}-{rangeEnd} de {total} resultado
                      {total !== 1 ? "s" : ""}
                      {search.trim() ? " (filtrado)" : ""}
                    </span>
                    <div className="trips-pagination-pages">
                      <button
                        type="button"
                        className="trips-page-btn"
                        disabled={safePage <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        aria-label="Página anterior"
                      >
                        ‹
                      </button>
                      {pageNumbers.map((n) => (
                        <button
                          key={n}
                          type="button"
                          className={`trips-page-btn ${n === safePage ? "active" : ""}`}
                          onClick={() => setPage(n)}
                        >
                          {n}
                        </button>
                      ))}
                      <button
                        type="button"
                        className="trips-page-btn"
                        disabled={safePage >= totalPages}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        aria-label="Próxima página"
                      >
                        ›
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
