import { useEffect, useMemo, useState } from "react";
import ContentHeader from "./ContentHeader";
import CargaCreateModal from "./CargaCreateModal";
import CargaEditModal from "./CargaEditModal";
import Button from "@components/common/Button";
import Loading from "@components/common/Loading";
import ConfirmModal from "@components/common/ConfirmModal";
import { useCaminhoes } from "@controllers/caminhaoController";
import { useCargas, useDeleteCarga } from "@controllers/cargaController";
import { useToast } from "@/contexts/ToastContext";
import type { CaminhaoCompleto, Carga } from "@/types/models";

import "./Management.css";
import "./Trips.css";

const PAGE_SIZE = 5;
const FETCH_LIMIT = 500;

function parseTemp(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function tempKind(
  atual: number | null,
  min: number | null,
  max: number | null,
): "none" | "neutral" | "warn" | "danger" {
  if (atual === null) return "none";
  if (min === null || max === null) return "neutral";
  if (atual < min || atual > max) return "danger";
  const span = max - min;
  if (span <= 0) return "neutral";
  const band = span * 0.1;
  if (atual <= min + band || atual >= max - band) return "warn";
  return "neutral";
}

function formatTempDisplay(n: number): string {
  return `${Number.isInteger(n) ? String(n) : n.toFixed(1)}°C`;
}

export default function Cargas() {
  const { addToast } = useToast();
  const { data: cargasRaw = [], isLoading } = useCargas(1, FETCH_LIMIT);
  const { data: caminhoesRaw = [] } = useCaminhoes(1, FETCH_LIMIT);
  const deleteCarga = useDeleteCarga();

  const cargas = cargasRaw as Carga[];
  const caminhoes = caminhoesRaw as CaminhaoCompleto[];

  const truckByCargaId = useMemo(() => {
    const m = new Map<number, CaminhaoCompleto>();
    for (const t of caminhoes) {
      if (t.id_carga != null && t.id_carga > 0) {
        m.set(t.id_carga, t);
      }
    }
    return m;
  }, [caminhoes]);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [cargaToDelete, setCargaToDelete] = useState<{ id: number; label: string } | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [cargaToEdit, setCargaToEdit] = useState<Carga | null>(null);

  const handleEditClick = (row: Carga) => {
    setCargaToEdit(row);
    setEditOpen(true);
  };

  const closeEditModal = () => {
    setEditOpen(false);
    setCargaToEdit(null);
  };

  const totalCadastradas = cargas.length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return cargas.filter((row) => {
      if (!q) return true;
      const truck = truckByCargaId.get(row.id);
      const placa = truck?.placa?.trim().toLowerCase() ?? "";
      const tipo = row.tipo?.trim().toLowerCase() ?? "";
      const hay = `${tipo} ${placa}`;
      return hay.includes(q);
    });
  }, [cargas, search, truckByCargaId]);

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

  const handleDeleteClick = (id: number, label: string) => {
    setCargaToDelete({ id, label });
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!cargaToDelete) return;
    try {
      await deleteCarga.mutateAsync(cargaToDelete.id);
      addToast({ message: "Carga excluída com sucesso.", type: "success" });
      setDeleteModalOpen(false);
      setCargaToDelete(null);
    } catch {
      addToast({ message: "Não foi possível excluir a carga.", type: "error" });
    }
  };

  return (
    <div className="dashboard-page trips-page">
      <ContentHeader
        title="Cargas"
        subtitle="Gerencie e acompanhe as cargas da operação."
        actions={
          <Button variant="primary" size="small" onClick={() => setCreateOpen(true)}>
            + Nova carga
          </Button>
        }
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
                placeholder="Tipo ou placa do veículo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Busca"
              />
            </div>
          </div>

          <aside className="trips-metric-card">
            <span className="trips-metric-label">Cargas cadastradas</span>
            <span className="trips-metric-value">{totalCadastradas}</span>
            <span className="trips-metric-hint">Total no sistema</span>
          </aside>
        </section>

        <div className="table-container">
          {isLoading ? (
            <Loading message="Carregando cargas..." />
          ) : (
            <>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Veículo</th>
                    <th>Faixa °C</th>
                    <th>Atual</th>
                    <th>Localização</th>
                    <th style={{ textAlign: "right" }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((row) => {
                    const truck = truckByCargaId.get(row.id);
                    const placa = truck?.placa?.trim() ? truck.placa : "—";
                    const tAtual = parseTemp(row.temperatura_atual);
                    const tMin = parseTemp(row.temperatura_minima);
                    const tMax = parseTemp(row.temperatura_maxima);
                    const tk = tempKind(tAtual, tMin, tMax);
                    const tipo = row.tipo?.trim() ? row.tipo : "—";
                    const faixa =
                      tMin !== null && tMax !== null
                        ? `${formatTempDisplay(tMin)} a ${formatTempDisplay(tMax)}`
                        : "—";

                    return (
                      <tr key={row.id}>
                        <td>
                          <span className="cell-main-text">{tipo}</span>
                        </td>
                        <td>
                          <span className="trips-placa-pill">{placa}</span>
                        </td>
                        <td>
                          <span className="cell-sub-text">{faixa}</span>
                        </td>
                        <td>
                          {tAtual === null ? (
                            <span className="cell-sub-text">N/A</span>
                          ) : (
                            <span
                              className={
                                tk === "danger"
                                  ? "trips-temp-danger"
                                  : tk === "warn"
                                    ? "trips-temp-warn"
                                    : undefined
                              }
                            >
                              {formatTempDisplay(tAtual)}
                            </span>
                          )}
                        </td>
                        <td>
                          <span className="cell-sub-text">
                            {Number.isFinite(row.latitude) && Number.isFinite(row.longitude)
                              ? `${row.latitude.toFixed(4)}, ${row.longitude.toFixed(4)}`
                              : "—"}
                          </span>
                        </td>
                        <td>
                          <div className="table-actions">
                            <button
                              type="button"
                              className="btn-icon-action"
                              title="Editar"
                              onClick={() => handleEditClick(row)}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              className="btn-icon-action danger"
                              title="Excluir"
                              onClick={() => handleDeleteClick(row.id, tipo)}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                <line x1="10" y1="11" x2="10" y2="17" />
                                <line x1="14" y1="11" x2="14" y2="17" />
                              </svg>
                            </button>
                          </div>
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
                        Nenhuma carga encontrada com os filtros atuais.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {total > 0 && (
                <div className="trips-pagination">
                  <span>
                    {total === 0
                      ? "Nenhum resultado"
                      : `Exibindo ${sliceFrom + 1}-${rangeEnd} de ${total} resultado${total !== 1 ? "s" : ""}`}
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
      </div>

      <CargaCreateModal isOpen={createOpen} onClose={() => setCreateOpen(false)} />

      <CargaEditModal
        isOpen={editOpen}
        onClose={closeEditModal}
        carga={cargaToEdit}
      />

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setCargaToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Confirmar exclusão"
        message={`Deseja excluir a carga "${cargaToDelete?.label}"? Esta ação não pode ser desfeita.`}
      />
    </div>
  );
}
