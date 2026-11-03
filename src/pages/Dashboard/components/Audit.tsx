import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import ContentHeader from "./ContentHeader";
import Loading from "@components/common/Loading";
import Button from "@components/common/Button";
import { useTelemetriaAuditoria } from "@controllers/cargaController";
import { useEntregasCompleto } from "@controllers/entregaController";
import { useToast } from "@/contexts/ToastContext";
import { cargaService } from "@services/cargaService";
import { alertaService } from "@services/alertaService";
import { exportTripDossierPdf } from "@/utils/exportTripDossierPdf";
import { exportTripTelemetryCsv } from "@/utils/exportTripTelemetryCsv";
import { yieldToMain } from "@/utils/tripDossierHelpers";
import type { CargaTelemetriaAuditoria, EntregaCompleta } from "@/types/models";

import "./Management.css";
import "./Trips.css";
import "./Alertas.css";

const PAGE_SIZE = 10;
const FETCH_LIMIT = 300;
const ENTREGAS_FETCH_LIMIT = 100;

type ExportKind = "pdf" | "csv" | null;

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

function formatEntregaDeliveryDate(entrega: EntregaCompleta): string {
  const raw = entrega.data_entrega ?? entrega.updated_at;
  if (!raw) return "—";
  try {
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("pt-BR");
  } catch {
    return "—";
  }
}

function entregaOptionLabel(entrega: EntregaCompleta): string {
  const placa = entrega.placa_caminhao?.trim() || "—";
  const cliente = entrega.nome_cliente?.trim() || "—";
  const data = formatEntregaDeliveryDate(entrega);
  return `#${entrega.id} · ${placa} · ${cliente} · ${data}`;
}

export default function Audit() {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const { data: rawRows = [], isLoading, isError, refetch } = useTelemetriaAuditoria(1, FETCH_LIMIT);
  const rows = rawRows as CargaTelemetriaAuditoria[];

  const {
    data: entregasRaw = [],
    isLoading: entregasLoading,
  } = useEntregasCompleto(1, ENTREGAS_FETCH_LIMIT);

  const entregasFinalizadas = useMemo(() => {
    const list = entregasRaw as EntregaCompleta[];
    return list.filter(
      (e) =>
        e.status === "entregue" &&
        e.id_carga != null &&
        Number.isFinite(e.id_carga) &&
        e.id_carga > 0,
    );
  }, [entregasRaw]);

  const [selectedEntregaId, setSelectedEntregaId] = useState<number | "">("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState<ExportKind>(null);

  useEffect(() => {
    if (entregasFinalizadas.length === 0) {
      setSelectedEntregaId("");
      return;
    }
    setSelectedEntregaId((prev) => {
      if (prev !== "" && entregasFinalizadas.some((e) => e.id === prev)) {
        return prev;
      }
      return entregasFinalizadas[0].id;
    });
  }, [entregasFinalizadas]);

  const selectedEntrega = useMemo(
    () => entregasFinalizadas.find((e) => e.id === selectedEntregaId) ?? null,
    [entregasFinalizadas, selectedEntregaId],
  );

  const selectedCargaId = selectedEntrega?.id_carga ?? null;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let base = rows;
    if (selectedCargaId != null) {
      base = base.filter((row) => row.id_carga === selectedCargaId);
    }
    if (!q) return base;
    return base.filter((row) => {
      const c = unwrapCarga(row.carga);
      const tipo = c?.tipo?.trim().toLowerCase() ?? "";
      const idC = String(row.id_carga ?? "");
      const idReg = String(row.id ?? "");
      return tipo.includes(q) || idC.includes(q) || idReg.includes(q);
    });
  }, [rows, search, selectedCargaId]);

  useEffect(() => {
    setPage(1);
  }, [search, selectedCargaId]);

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

  const exportsDisabled =
    entregasLoading || selectedEntrega == null || selectedCargaId == null || exporting !== null;

  const fetchExportData = useCallback(async () => {
    if (selectedEntrega == null || selectedCargaId == null) {
      throw new Error("no_selection");
    }
    const pings = await queryClient.fetchQuery({
      queryKey: ["carga-telemetria-auditoria", "por-carga", selectedCargaId],
      queryFn: () => cargaService.listTelemetriaAuditoriaPorCarga(selectedCargaId),
    });
    const alertas = await alertaService.getAll({ id_carga: selectedCargaId, limit: 100 });
    return { entrega: selectedEntrega, pings, alertas };
  }, [queryClient, selectedCargaId, selectedEntrega]);

  const handleExportPdf = async () => {
    if (exportsDisabled) return;
    setExporting("pdf");
    try {
      await yieldToMain();
      const { entrega, pings, alertas } = await fetchExportData();
      exportTripDossierPdf({ entrega, pings, alertas });
      addToast({
        message: t("audit.exportPdfSuccess", "Dossiê PDF gerado com sucesso."),
        type: "success",
      });
      if (pings.length === 0) {
        addToast({
          message: t(
            "audit.exportNoPingsInfo",
            "Esta viagem não possui registos de telemetria na auditoria.",
          ),
          type: "info",
        });
      }
    } catch (err) {
      console.error("Falha ao gerar dossiê PDF:", err);
      addToast({
        message: t("audit.exportPdfError", "Não foi possível gerar o dossiê PDF."),
        type: "error",
      });
    } finally {
      setExporting(null);
    }
  };

  const handleExportCsv = async () => {
    if (exportsDisabled) return;
    setExporting("csv");
    try {
      await yieldToMain();
      const { entrega, pings } = await fetchExportData();
      const idCarga = entrega.id_carga!;
      exportTripTelemetryCsv({ pings, idCarga });
      addToast({
        message: t("audit.exportCsvSuccess", "Dados exportados em CSV com sucesso."),
        type: "success",
      });
      if (pings.length === 0) {
        addToast({
          message: t(
            "audit.exportNoPingsInfo",
            "Esta viagem não possui registos de telemetria na auditoria.",
          ),
          type: "info",
        });
      }
    } catch (err) {
      console.error("Falha ao exportar CSV:", err);
      addToast({
        message: t("audit.exportCsvError", "Não foi possível exportar os dados em CSV."),
        type: "error",
      });
    } finally {
      setExporting(null);
    }
  };

  const headerActions = (
    <>
      <Button
        variant="secondary"
        size="medium"
        onClick={handleExportPdf}
        disabled={exportsDisabled}
        loading={exporting === "pdf"}
        loadingText={t("audit.exportGenerating", "Gerando…")}
      >
        {t("audit.exportPdf", "Exportar Dossiê (PDF)")}
      </Button>
      <Button
        variant="secondary"
        size="medium"
        onClick={handleExportCsv}
        disabled={exportsDisabled}
        loading={exporting === "csv"}
        loadingText={t("audit.exportGenerating", "Gerando…")}
      >
        {t("audit.exportCsv", "Exportar Dados (CSV)")}
      </Button>
    </>
  );

  return (
    <div className="dashboard-page trips-page">
      <ContentHeader
        title={t("audit.title", "Auditoria")}
        subtitle={t("audit.subtitle", "Registos de telemetria por carga — atualização em tempo quase real.")}
        actions={headerActions}
      />

      <div className="page-content">
        <section className="trips-toolbar" aria-label={t("audit.filtersAria", "Filtros")}>
          <div className="trips-toolbar-fields">
            <div className="alertas-filter-row">
              <label className="trips-metric-label" htmlFor="audit-trip-select">
                {t("audit.tripSelectLabel", "Viagem finalizada")}
              </label>
              <select
                id="audit-trip-select"
                className="alertas-filter-select"
                value={selectedEntregaId === "" ? "" : String(selectedEntregaId)}
                onChange={(e) => {
                  const v = e.target.value;
                  setSelectedEntregaId(v === "" ? "" : Number(v));
                }}
                disabled={entregasLoading || entregasFinalizadas.length === 0}
                aria-label={t("audit.tripSelectAria", "Selecionar viagem finalizada para exportação")}
              >
                {entregasFinalizadas.length === 0 ? (
                  <option value="">
                    {t("audit.noFinishedTrips", "Nenhuma viagem entregue disponível")}
                  </option>
                ) : (
                  entregasFinalizadas.map((e) => (
                    <option key={e.id} value={e.id}>
                      {entregaOptionLabel(e)}
                    </option>
                  ))
                )}
              </select>
            </div>

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
                placeholder={t("audit.searchPlaceholder", "Tipo da carga, id da carga ou id do registo…")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label={t("audit.searchAria", "Busca")}
              />
            </div>
          </div>

          <aside className="trips-metric-card">
            <span className="trips-metric-label">{t("audit.recordsLoaded", "Registos carregados")}</span>
            <span className="trips-metric-value">{filtered.length}</span>
            <span className="trips-metric-hint">
              {selectedCargaId != null
                ? t("audit.recordsHintFiltered", "Filtrado pela carga #{{id}} · até {{limit}} recentes globais", {
                    id: selectedCargaId,
                    limit: FETCH_LIMIT,
                  })
                : t("audit.recordsHint", "Até {{limit}} mais recentes · atualização automática a cada 5 s", {
                    limit: FETCH_LIMIT,
                  })}
            </span>
          </aside>
        </section>

        {isError ? (
          <div
            className="table-container"
            style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}
          >
            <p>{t("audit.loadError", "Não foi possível carregar a auditoria.")}</p>
            <button type="button" className="trips-page-btn" onClick={() => refetch()}>
              {t("audit.retry", "Tentar novamente")}
            </button>
          </div>
        ) : (
          <div className="table-container">
            {isLoading ? (
              <Loading message={t("audit.loading", "Carregando telemetria…")} />
            ) : (
              <>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{t("audit.tableDate", "Data / hora")}</th>
                      <th>{t("audit.tableCargo", "Carga")}</th>
                      <th>{t("audit.tableTemp", "Temperatura")}</th>
                      <th>{t("audit.tableLat", "Latitude")}</th>
                      <th>{t("audit.tableLon", "Longitude")}</th>
                      <th>{t("audit.tableRecordId", "Id registo")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((row) => {
                      const c = unwrapCarga(row.carga);
                      const tipo = c?.tipo?.trim() ? c.tipo : "—";
                      const idCarga = row.id_carga;
                      const temp = parseNum(row.temperatura);
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
                              {t("audit.cargoNumber", "Carga #{{id}}", { id: idCarga })}
                            </span>
                          </td>
                          <td>
                            {temp === null ? (
                              <span className="cell-sub-text">—</span>
                            ) : (
                              <span className="cell-main-text">{temp.toFixed(1)}°C</span>
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
                            ? t("audit.noRecords", "Nenhum registo de telemetria encontrado.")
                            : t("audit.noFilterResults", "Nenhum resultado com os filtros atuais.")}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {total > 0 && (
                  <div className="trips-pagination">
                    <span>
                      {t("audit.paginationShowing", "Exibindo {{from}}-{{to}} de {{total}} resultado{{s}}{{filtered}}", {
                        from: sliceFrom + 1,
                        to: rangeEnd,
                        total,
                        s: total !== 1 ? "s" : "",
                        filtered: search.trim() ? t("audit.paginationFiltered", " (filtrado)") : "",
                      })}
                    </span>
                    <div className="trips-pagination-pages">
                      <button
                        type="button"
                        className="trips-page-btn"
                        disabled={safePage <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        aria-label={t("audit.prevPage", "Página anterior")}
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
                        aria-label={t("audit.nextPage", "Próxima página")}
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
