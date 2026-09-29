import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
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

function formatRelative(iso: string, t: ReturnType<typeof useTranslation>["t"]): string {
  const time = Date.parse(iso);
  if (!Number.isFinite(time)) return "—";
  const diffSec = Math.max(0, Math.floor((Date.now() - time) / 1000));
  if (diffSec < 60) return String(t("notifications.timeSec", "há {{count}}s", { count: diffSec }));
  const min = Math.floor(diffSec / 60);
  if (min < 60) return String(t("notifications.timeMin", "há {{count}}min", { count: min }));
  const h = Math.floor(min / 60);
  if (h < 24) return String(t("notifications.timeHours", "há {{count}}h", { count: h }));
  const d = Math.floor(h / 24);
  return String(t("notifications.timeDays", "há {{count}}d", { count: d }));
}

interface NotificationBellProps {
  /** Callback opcional ao clicar em "Ver todos" (ex.: navegar para aba Alertas). */
  onOpenAlertasPage?: () => void;
}

export default function NotificationBell({ onOpenAlertasPage }: NotificationBellProps) {
  const { t } = useTranslation();
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
            ? totalAbertos === 1
              ? t("notifications.ariaHasAlerts_one", "Notificações — 1 alerta aberto")
              : t("notifications.ariaHasAlerts_other", "Notificações — {{count}} alertas abertos", {
                  count: totalAbertos,
                })
            : t("notifications.ariaNoAlerts", "Notificações — nenhuma pendência")
        }
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((o) => !o)}
        title={
          hasOpen
            ? t("notifications.titleHasAlerts", "{{count}} alerta(s) aberto(s)", { count: totalAbertos })
            : t("notifications.titleNoAlerts", "Sem alertas no momento")
        }
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
        <div className="notif-bell-dropdown" role="menu" aria-label={t("notifications.dropdownAria", "Alertas abertos")}>
          <div className="notif-bell-header">
            <div>
              <h4>{t("notifications.dropdownTitle", "Alertas abertos")}</h4>
              <p>
                {hasOpen
                  ? t("notifications.inProgress", "{{count}} em andamento", { count: totalAbertos })
                  : t("notifications.noActive", "Nenhuma pendência ativa")}
              </p>
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
                {t("notifications.viewAll", "Ver todos")}
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
                <p>{t("notifications.allUnderControl", "Tudo sob controle. Nenhum alerta térmico aberto agora.")}</p>
              </li>
            )}
            {alertasAbertos.map((a) => {
              const carga = unwrapCarga(a.carga);
              const tipoCarga = carga?.tipo?.trim() || t("notifications.noType", "Carga sem tipo");
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
                      {t("notifications.tempPrefix", "Temperatura ")}{a.tipo === "alta" ? t("notifications.high", "ALTA") : t("notifications.low", "BAIXA")} —{" "}
                      <strong>{tipoCarga}</strong>
                    </div>
                    <div className="notif-bell-item-meta">
                      {t("notifications.itemMeta", "Carga #{{cargaId}} · Alerta #{{alertaId}}", {
                        cargaId: a.id_carga,
                        alertaId: a.id,
                      })}
                      {" · "}
                      {formatRelative(a.aberto_at, t)}
                    </div>
                    <div className="notif-bell-item-temp">
                      {t("notifications.peakPrefix", "Pico: ")}
                      <strong>{pico !== null ? `${pico.toFixed(1)}°C` : "—"}</strong>
                      <span className="notif-bell-item-range">
                        {" "}
                        {t("notifications.range", "(faixa {{min}}°C – {{max}}°C)", {
                          min: min !== null ? min.toFixed(1) : "—",
                          max: max !== null ? max.toFixed(1) : "—",
                        })}
                      </span>
                    </div>
                    <div className="notif-bell-item-pings">
                      {a.qtd_pings === 1
                        ? t("notifications.pingsOutOfRange_one", "1 ping fora da faixa")
                        : t("notifications.pingsOutOfRange_other", "{{count}} pings fora da faixa", { count: a.qtd_pings })}
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
