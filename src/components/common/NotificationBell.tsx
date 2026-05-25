import { useEffect, useRef, useState } from "react";
import { useAlertasNotifications } from "@/contexts/AlertasNotificationContext";
import type { CargaAlerta } from "@/types/models";
import "./NotificationBell.css";

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

function formatRelative(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "—";
  const diffSec = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (diffSec < 60) return `há ${diffSec}s`;
  const min = Math.floor(diffSec / 60);
  if (min < 60) return `há ${min}min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.floor(h / 24);
  return `há ${d}d`;
}

interface NotificationBellProps {
  /** Callback opcional ao clicar em "Ver todos" (ex.: navegar para aba Alertas). */
  onOpenAlertasPage?: () => void;
}

export default function NotificationBell({ onOpenAlertasPage }: NotificationBellProps) {
  const { alertasAbertos, totalAbertos } = useAlertasNotifications();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Fecha ao clicar fora.
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const hasOpen = totalAbertos > 0;
  const badge = totalAbertos > 99 ? "99+" : String(totalAbertos);

  return (
    <div className="notif-bell" ref={containerRef}>
      <button
        type="button"
        className={`notif-bell-btn ${hasOpen ? "has-alerts" : ""}`}
        aria-label={
          hasOpen
            ? `Notificações — ${totalAbertos} alerta${totalAbertos !== 1 ? "s" : ""} aberto${
                totalAbertos !== 1 ? "s" : ""
              }`
            : "Notificações — nenhuma pendência"
        }
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((o) => !o)}
        title={hasOpen ? `${totalAbertos} alerta(s) aberto(s)` : "Sem alertas no momento"}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 01-3.46 0"></path>
        </svg>
        {hasOpen && <span className="notif-bell-badge">{badge}</span>}
      </button>

      {open && (
        <div className="notif-bell-dropdown" role="menu" aria-label="Alertas abertos">
          <div className="notif-bell-header">
            <div>
              <h4>Alertas abertos</h4>
              <p>{hasOpen ? `${totalAbertos} em andamento` : "Nenhuma pendência ativa"}</p>
            </div>
            {onOpenAlertasPage && (
              <button
                type="button"
                className="notif-bell-action-link"
                onClick={() => {
                  setOpen(false);
                  onOpenAlertasPage();
                }}
              >
                Ver todos
              </button>
            )}
          </div>

          <ul className="notif-bell-list">
            {alertasAbertos.length === 0 && (
              <li className="notif-bell-empty">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M9 12l2 2 4-4" />
                  <circle cx="12" cy="12" r="10" />
                </svg>
                <p>Tudo sob controle. Nenhum alerta térmico aberto agora.</p>
              </li>
            )}
            {alertasAbertos.map((a) => {
              const carga = unwrapCarga(a.carga);
              const tipoCarga = carga?.tipo?.trim() || "Carga sem tipo";
              const pico = parseNum(a.temperatura_pico);
              const min = parseNum(a.limite_minimo);
              const max = parseNum(a.limite_maximo);
              return (
                <li
                  key={a.id}
                  className={`notif-bell-item notif-bell-item--${a.tipo}`}
                >
                  <div className="notif-bell-item-icon" aria-hidden>
                    {a.tipo === "alta" ? "▲" : "▼"}
                  </div>
                  <div className="notif-bell-item-body">
                    <div className="notif-bell-item-title">
                      Temperatura {a.tipo === "alta" ? "ALTA" : "BAIXA"} —{" "}
                      <strong>{tipoCarga}</strong>
                    </div>
                    <div className="notif-bell-item-meta">
                      Carga #{a.id_carga} · Alerta #{a.id}
                      {" · "}
                      {formatRelative(a.aberto_at)}
                    </div>
                    <div className="notif-bell-item-temp">
                      Pico:{" "}
                      <strong>{pico !== null ? `${pico.toFixed(1)}°C` : "—"}</strong>
                      <span className="notif-bell-item-range">
                        {" "}
                        (faixa {min !== null ? min.toFixed(1) : "—"}°C –{" "}
                        {max !== null ? max.toFixed(1) : "—"}°C)
                      </span>
                    </div>
                    <div className="notif-bell-item-pings">
                      {a.qtd_pings} ping{a.qtd_pings !== 1 ? "s" : ""} fora da faixa
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
