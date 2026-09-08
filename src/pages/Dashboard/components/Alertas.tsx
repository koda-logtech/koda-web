import { useEffect, useMemo, useState } from "react";
import ContentHeader from "./ContentHeader";
import Loading from "@components/common/Loading";
import {
  ALERTAS_LIVE_REFETCH_MS,
  useAlertas,
  useCancelarAlerta,
} from "@controllers/alertaController";
import type {
  CargaAlerta,
  CargaAlertaStatus,
  CargaAlertaTipo,
} from "@/types/models";

import "./Management.css";
import "./Trips.css";
import "./Alertas.css";

const PAGE_SIZE = 10;
const FETCH_LIMIT = 300;

type StatusFilter = "todos" | CargaAlertaStatus;
type TipoFilter = "todos" | CargaAlertaTipo;

function unwrapCarga(c: CargaAlerta["carga"]) {
  if (c == null) return null;
  if (Array.isArray(c)) return c[0] ?? null;
  return c;
}

function parseNum(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function formatWhen(iso: string | null | undefined): string {
  if (!iso) return "—";
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
    return iso ?? "—";
  }
}

/** Duração legível em pt-BR (`2h 13min`, `45min 12s`, `9s`). */
function formatDuracao(startIso: string, endIso: string | null): string {
  const start = new Date(startIso).getTime();
  const end = endIso ? new Date(endIso).getTime() : Date.now();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return "—";
  const totalSec = Math.floor((end - start) / 1000);
  if (totalSec < 60) return `${totalSec}s`;
  const min = Math.floor(totalSec / 60);
  if (min < 60) {
    const s = totalSec % 60;
    return s > 0 ? `${min}min ${s}s` : `${min}min`;
  }
  const h = Math.floor(min / 60);
  const mRest = min % 60;
  return mRest > 0 ? `${h}h ${mRest}min` : `${h}h`;
}

function StatusBadge({ status }: { status: CargaAlertaStatus }) {
  const label =
    status === "aberto" ? "Aberto" : status === "resolvido" ? "Resolvido" : "Cancelado";
  return <span className={`alerta-badge alerta-badge--${status}`}>{label}</span>;
}

function TipoBadge({ tipo }: { tipo: CargaAlertaTipo }) {
  const label = tipo === "alta" ? "Temp. alta" : "Temp. baixa";
  return (
    <span className={`alerta-badge alerta-badge--${tipo}`}>
      {tipo === "alta" ? "▲ " : "▼ "}
      {label}
    </span>
  );
}

export default function Alertas() {
  const { data: rawRows = [], isLoading, isError, refetch } = useAlertas(
    { page: 1, limit: FETCH_LIMIT },
    {
      staleTime: 0,
      refetchInterval: ALERTAS_LIVE_REFETCH_MS,
      refetchOnWindowFocus: true,
      refetchIntervalInBackground: true,
    },
  );
  const rows = rawRows as CargaAlerta[];
  const cancelarAlerta = useCancelarAlerta();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");
  const [tipoFilter, setTipoFilter] = useState<TipoFilter>("todos");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (statusFilter !== "todos" && row.status !== statusFilter) return false;
      if (tipoFilter !== "todos" && row.tipo !== tipoFilter) return false;
      if (!q) return true;
      const c = unwrapCarga(row.carga);
      const tipoCarga = c?.tipo?.trim().toLowerCase() ?? "";
      const idC = String(row.id_carga ?? "");
      const idAlerta = String(row.id ?? "");
      return tipoCarga.includes(q) || idC.includes(q) || idAlerta.includes(q);
    });
  }, [rows, search, statusFilter, tipoFilter]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, tipoFilter]);

  const abertos = useMemo(() => rows.filter((r) => r.status === "aberto").length, [rows]);
  const resolvidos = useMemo(
    () => rows.filter((r) => r.status === "resolvido").length,
    [rows],
  );

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

  const handleCancelar = async (id: number) => {
    if (!window.confirm(`Cancelar o alerta #${id}? Esta ação não pode ser desfeita.`)) {
      return;
    }
    try {
      await cancelarAlerta.mutateAsync(id);
    } catch (err) {
      // intencional: erro tratado abaixo
      window.alert("Não foi possível cancelar o alerta. Tente novamente.");
      console.error(err);
    }
  };

  return (
    <div className="dashboard-page trips-page alertas-page">
      <ContentHeader
        title="Alertas térmicos"
        subtitle="Eventos contínuos abertos automaticamente quando a temperatura sai da faixa permitida."
      />

      <div className="page-content">
        <section className="trips-toolbar" aria-label="Filtros de alertas">
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
                placeholder="Tipo da carga, id da carga ou id do alerta…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Busca"
              />
            </div>

            <div className="alertas-filter-row">
              <select
                className="alertas-filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                aria-label="Filtro por status"
              >
                <option value="todos">Todos os status</option>
                <option value="aberto">Apenas abertos</option>
                <option value="resolvido">Apenas resolvidos</option>
                <option value="cancelado">Apenas cancelados</option>
              </select>

              <select
                className="alertas-filter-select"
                value={tipoFilter}
                onChange={(e) => setTipoFilter(e.target.value as TipoFilter)}
                aria-label="Filtro por tipo"
              >
                <option value="todos">Todos os tipos</option>
                <option value="alta">Temperatura alta</option>
                <option value="baixa">Temperatura baixa</option>
              </select>
            </div>
          </div>

          <aside className="alertas-metrics">
            <div className="alertas-metric-card alertas-metric-card--alert">
              <span className="alertas-metric-label">Alertas abertos</span>
              <span className="alertas-metric-value">{abertos}</span>
              <span className="alertas-metric-hint">Atualização automática a cada 10 s</span>
            </div>
            <div className="alertas-metric-card alertas-metric-card--info">
              <span className="alertas-metric-label">Resolvidos</span>
              <span className="alertas-metric-value">{resolvidos}</span>
              <span className="alertas-metric-hint">Nos últimos {FETCH_LIMIT} registos</span>
            </div>
          </aside>
        </section>

        {isError ? (
          <div
            className="table-container"
            style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}
          >
            <p>Não foi possível carregar os alertas.</p>
            <button type="button" className="trips-page-btn" onClick={() => refetch()}>
              Tentar novamente
            </button>
          </div>
        ) : (
          <div className="table-container">
            {isLoading ? (
              <Loading message="Carregando alertas…" />
            ) : (
              <>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Tipo</th>
                      <th>Carga</th>
                      <th>Faixa permitida</th>
                      <th>Temp. (início / pico / fim)</th>
                      <th>Aberto em</th>
                      <th>Resolvido em</th>
                      <th>Duração</th>
                      <th>Pings</th>
                      <th>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((row) => {
                      const c = unwrapCarga(row.carga);
                      const tipoCarga = c?.tipo?.trim() ? c.tipo : "—";
                      const min = parseNum(row.limite_minimo);
                      const max = parseNum(row.limite_maximo);
                      const ini = parseNum(row.temperatura_inicio);
                      const pico = parseNum(row.temperatura_pico);
                      const fim = parseNum(row.temperatura_fim);
                      const isAtivo = row.status === "aberto";

                      return (
                        <tr key={row.id}>
                          <td>
                            <StatusBadge status={row.status} />
                          </td>
                          <td>
                            <TipoBadge tipo={row.tipo} />
                          </td>
                          <td>
                            <span className="cell-main-text">{tipoCarga}</span>
                            <span
                              className="cell-sub-text"
                              style={{ display: "block", marginTop: 4 }}
                            >
                              Carga #{row.id_carga} · Alerta #{row.id}
                            </span>
                          </td>
                          <td>
                            <span className="cell-sub-text">
                              {min !== null ? `${min.toFixed(1)}°C` : "—"}
                              {" – "}
                              {max !== null ? `${max.toFixed(1)}°C` : "—"}
                            </span>
                          </td>
                          <td>
                            <span className="cell-sub-text">
                              {ini !== null ? `${ini.toFixed(1)}°C` : "—"}
                              {" → "}
                            </span>
                            <span
                              className={`alertas-temp-pico alertas-temp-pico--${row.tipo}`}
                            >
                              {pico !== null ? `${pico.toFixed(1)}°C` : "—"}
                            </span>
                            <span className="cell-sub-text">
                              {" → "}
                              {fim !== null ? `${fim.toFixed(1)}°C` : "—"}
                            </span>
                          </td>
                          <td>
                            <span className="cell-sub-text">{formatWhen(row.aberto_at)}</span>
                          </td>
                          <td>
                            <span className="cell-sub-text">
                              {formatWhen(row.resolvido_at)}
                            </span>
                          </td>
                          <td>
                            <span className="cell-sub-text">
                              {formatDuracao(row.aberto_at, row.resolvido_at)}
                              {isAtivo ? " (em curso)" : ""}
                            </span>
                          </td>
                          <td>
                            <span className="cell-main-text">{row.qtd_pings}</span>
                          </td>
                          <td>
                            {isAtivo ? (
                              <button
                                type="button"
                                className="alertas-cancel-btn"
                                onClick={() => handleCancelar(row.id)}
                                disabled={cancelarAlerta.isPending}
                                title="Marcar alerta como cancelado (falso positivo)"
                              >
                                Cancelar
                              </button>
                            ) : (
                              <span className="cell-sub-text">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {pageRows.length === 0 && (
                      <tr>
                        <td
                          colSpan={10}
                          style={{
                            textAlign: "center",
                            padding: "3rem",
                            color: "var(--text-secondary)",
                          }}
                        >
                          {rows.length === 0
                            ? "Nenhum alerta registado até o momento."
                            : "Nenhum resultado com os filtros atuais."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {total > 0 && (
                  <div className="trips-pagination">
                    <span>
                      Exibindo {sliceFrom + 1}-{rangeEnd} de {total} alerta
                      {total !== 1 ? "s" : ""}
                      {search.trim() || statusFilter !== "todos" || tipoFilter !== "todos"
                        ? " (filtrado)"
                        : ""}
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
