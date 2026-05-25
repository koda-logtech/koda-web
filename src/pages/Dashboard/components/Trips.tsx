import { useEffect, useMemo, useState } from "react";
import ContentHeader from "./ContentHeader";
import TripCreateModal from "./TripCreateModal";
import TripEditModal from "./TripEditModal";
import Button from "@components/common/Button";
import Select from "@components/common/Select";
import Loading from "@components/common/Loading";
import { useUsers } from "@controllers/userController";
import { useEntregasCompleto, useDeleteEntrega } from "@controllers/entregaController";
import type { User } from "@/types/models";
import type { EntregaCompleta } from "@/types/models";
import ConfirmModal from "@components/common/ConfirmModal";
import { useToast } from "@/contexts/ToastContext";

import "./Management.css";
import "./Trips.css";

const PAGE_SIZE = 5;
const FETCH_LIMIT = 500;

function parseTemp(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/** Vermelho fora do intervalo; amarelo próximo dos limites (15% da faixa válida). */
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

const ENTREGA_STATUS_OPTIONS = [
  { value: "all", label: "Todos os status" },
  { value: "pendente", label: "Pendente" },
  { value: "em_transito", label: "Em trânsito" },
  { value: "no_armazem", label: "No armazém" },
  { value: "entregue", label: "Entregue" },
  { value: "cancelada", label: "Cancelada" },
];

function labelEntregaStatus(status: string): string {
  const map: Record<string, string> = {
    pendente: "Pendente",
    em_transito: "Em trânsito",
    no_armazem: "No armazém",
    entregue: "Entregue",
    cancelada: "Cancelada",
  };
  return map[status] ?? status;
}

function initials(nome: string): string {
  const safe = nome.trim() || "?";
  const p = safe.split(/\s+/).slice(0, 2);
  return p.map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

const STATUS_ATIVOS = new Set(["pendente", "em_transito", "no_armazem"]);

export default function Trips() {
  const { addToast } = useToast();
  const { data: entregasRaw = [], isLoading } = useEntregasCompleto(1, FETCH_LIMIT);
  const deleteEntrega = useDeleteEntrega();

  const entregas = entregasRaw as EntregaCompleta[];

  const [search, setSearch] = useState("");
  const [motoristaId, setMotoristaId] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [viagemToDelete, setViagemToDelete] = useState<{
    id: number;
    label: string;
  } | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [viagemToEdit, setViagemToEdit] = useState<EntregaCompleta | null>(null);

  const handleEditClick = (row: EntregaCompleta) => {
    setViagemToEdit(row);
    setEditOpen(true);
  };

  const closeEditModal = () => {
    setEditOpen(false);
    setViagemToEdit(null);
  };

  const { data: users = [] } = useUsers(1, 200);
  const drivers = useMemo(
    () => (users as User[]).filter((u) => u.role === "driver"),
    [users],
  );

  const viagensAtivas = useMemo(
    () => entregas.filter((r) => STATUS_ATIVOS.has(r.status)).length,
    [entregas],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const motoristaNome =
      motoristaId !== 0
        ? drivers.find((d) => Number(d.id) === motoristaId)?.name?.trim().toLowerCase()
        : null;

    return entregas.filter((row) => {
      if (motoristaNome) {
        const rowNome = row.nome_motorista?.trim().toLowerCase() ?? "";
        if (rowNome !== motoristaNome) return false;
      }
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (q) {
        const hay = [
          row.placa_caminhao,
          row.nome_cliente,
          row.endereco_cliente,
          row.nome_motorista,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [entregas, search, motoristaId, statusFilter, drivers]);

  const handleDeleteClick = (id: number, label: string) => {
    setViagemToDelete({ id, label });
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!viagemToDelete) return;
    try {
      await deleteEntrega.mutateAsync(viagemToDelete.id);
      addToast({ message: "Entrega excluída com sucesso.", type: "success" });
      setDeleteModalOpen(false);
      setViagemToDelete(null);
    } catch {
      addToast({ message: "Não foi possível excluir.", type: "error" });
    }
  };

  useEffect(() => {
    setPage(1);
  }, [search, motoristaId, statusFilter]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const sliceFrom = (safePage - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(sliceFrom, sliceFrom + PAGE_SIZE);
  const rangeEnd = total === 0 ? 0 : Math.min(sliceFrom + PAGE_SIZE, total);

  const handleMotoristaChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setMotoristaId(Number(e.target.value));
  };

  const handleStatusChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setStatusFilter(String(e.target.value));
  };

  const pageNumbers = useMemo(() => {
    const maxBtns = 5;
    let start = Math.max(1, safePage - Math.floor(maxBtns / 2));
    let end = Math.min(totalPages, start + maxBtns - 1);
    start = Math.max(1, end - maxBtns + 1);
    const nums: number[] = [];
    for (let i = start; i <= end; i++) nums.push(i);
    return nums;
  }, [safePage, totalPages]);

  return (
    <div className="dashboard-page trips-page">
      <ContentHeader
        title="Viagens"
        subtitle="Gerencie e acompanhe as viagens da operação."
        actions={
          <Button variant="primary" size="small" onClick={() => setCreateOpen(true)}>
            + Nova viagem
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
                placeholder="Cliente, endereço, placa ou motorista..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Busca geral"
              />
            </div>

            <div className="trips-filter-row">
              <Select
                label="Motorista"
                variant="underlined"
                name="motoristaId"
                value={motoristaId}
                onChange={handleMotoristaChange}
                options={[
                  { value: 0, label: "Todos os motoristas" },
                  ...drivers.map((d) => ({
                    value: Number(d.id),
                    label: d.name,
                  })),
                ]}
              />
              <Select
                label="Status"
                variant="underlined"
                name="status"
                value={statusFilter}
                onChange={handleStatusChange}
                options={ENTREGA_STATUS_OPTIONS}
              />
            </div>
          </div>

          <aside className="trips-metric-card">
            <span className="trips-metric-label">Viagens ativas</span>
            <span className="trips-metric-value">{viagensAtivas}</span>
            <span className="trips-metric-hint">Pendente, em trânsito ou no armazém</span>
          </aside>
        </section>

        <div className="table-container">
          {isLoading ? (
            <Loading message="Carregando entregas..." />
          ) : (
            <>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Motorista</th>
                    <th>Veículo</th>
                    <th>Destino</th>
                    <th>Status</th>
                    <th>Temp. atual</th>
                    <th style={{ textAlign: "right" }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((row) => {
                    const tAtual = parseTemp(row.temperatura_atual);
                    const tMin = parseTemp(row.temperatura_minima);
                    const tMax = parseTemp(row.temperatura_maxima);
                    const tk = tempKind(tAtual, tMin, tMax);
                    const nomeMot = row.nome_motorista?.trim() ? row.nome_motorista : "—";
                    const placa = row.placa_caminhao?.trim() ? row.placa_caminhao : "—";
                    const cliente = row.nome_cliente?.trim() ? row.nome_cliente : "—";
                    const endereco = row.endereco_cliente?.trim()
                      ? row.endereco_cliente
                      : "Sem endereço";

                    return (
                      <tr key={row.id}>
                        <td>
                          <div className="trips-motorista-cell">
                            <span className="trips-motorista-avatar" aria-hidden>
                              {initials(nomeMot)}
                            </span>
                            <span className="cell-main-text">{nomeMot}</span>
                          </div>
                        </td>
                        <td>
                          <span className="trips-placa-pill">{placa}</span>
                        </td>
                        <td>
                          <span className="cell-main-text">{cliente}</span>
                          <span className="cell-sub-text">{endereco}</span>
                        </td>
                        <td>
                          <span
                            className={`status-badge trips-entrega-status trips-entrega-${row.status}`}
                          >
                            {labelEntregaStatus(row.status)}
                          </span>
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
                              onClick={() =>
                                handleDeleteClick(
                                  row.id,
                                  `${cliente} · ${placa}`,
                                )
                              }
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
                        Nenhuma entrega encontrada com os filtros atuais.
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

      <TripCreateModal isOpen={createOpen} onClose={() => setCreateOpen(false)} />

      <TripEditModal
        isOpen={editOpen}
        onClose={closeEditModal}
        entrega={viagemToEdit}
      />

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setViagemToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Confirmar exclusão"
        message={`Deseja excluir a entrega "${viagemToDelete?.label}"? Esta ação não pode ser desfeita.`}
      />
    </div>
  );
}
