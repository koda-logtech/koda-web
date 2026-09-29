import { useEffect } from "react";
import { useAlertasNotifications } from "@/contexts/AlertasNotificationContext";
import type { CargaAlerta } from "@/types/models";
import { useTranslation } from "react-i18next";
import "./NewAlertModal.css";

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

function formatWhen(iso: string, locale: string = "pt-BR"): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(locale, {
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

interface NewAlertModalProps {
  /** Callback opcional para "Ver na lista" — geralmente leva à aba Alertas. */
  onOpenAlertasPage?: () => void;
}

export default function NewAlertModal({ onOpenAlertasPage }: NewAlertModalProps) {
  const { t, i18n } = useTranslation();
  const currentLocale = i18n.language?.startsWith("en") ? "en-US" : "pt-BR";
  const { pendingNewAlerts, dismissCurrentNewAlert, dismissAllNewAlerts } =
    useAlertasNotifications();

  const current = pendingNewAlerts[0] ?? null;
  const remaining = Math.max(0, pendingNewAlerts.length - 1);

  // ESC fecha o modal atual (mas mantém os próximos da fila).
  useEffect(() => {
    if (!current) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") dismissCurrentNewAlert();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [current, dismissCurrentNewAlert]);

  if (!current) return null;

  const carga = unwrapCarga(current.carga);
  const tipoCarga = carga?.tipo?.trim() || t("newAlertModal.noType", "Carga sem tipo");
  const pico = parseNum(current.temperatura_pico);
  const inicio = parseNum(current.temperatura_inicio);
  const min = parseNum(current.limite_minimo);
  const max = parseNum(current.limite_maximo);
  const isAlta = current.tipo === "alta";

  return (
    <div
      className={`new-alert-overlay new-alert-overlay--${current.tipo}`}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="new-alert-title"
      aria-describedby="new-alert-desc"
    >
      <div className={`new-alert-content new-alert-content--${current.tipo}`}>
        <div className="new-alert-flash" aria-hidden />

        <div className="new-alert-header">
          <div className="new-alert-icon" aria-hidden>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="44"
              height="44"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
          <div>
            <p className="new-alert-eyebrow">{t("newAlertModal.eyebrow", "Novo alerta térmico")}</p>
            <h2 id="new-alert-title" className="new-alert-title">
              {isAlta
                ? t("newAlertModal.aboveMax", "Temperatura ACIMA do máximo")
                : t("newAlertModal.belowMin", "Temperatura ABAIXO do mínimo")}
            </h2>
          </div>
          {remaining > 0 && (
            <span
              className="new-alert-queue-pill"
              title={t("newAlertModal.moreInQueue", "Mais {{count}} alerta(s) na fila", { count: remaining })}
            >
              +{remaining}
            </span>
          )}
        </div>

        <p id="new-alert-desc" className="new-alert-desc">
          {t("newAlertModal.desc1", "A carga")} <strong>{tipoCarga}</strong>{" "}
          {t("newAlertModal.desc2", "(Carga #{{cargaId}}) saiu da faixa de temperatura permitida e disparou o alerta", {
            cargaId: current.id_carga?.toString() || "",
          })}{" "}
          <strong>#{current.id}</strong>
          {t("newAlertModal.desc3", ".")}
        </p>

        <div className="new-alert-grid">
          <div className="new-alert-cell">
            <span className="new-alert-cell-label">{t("newAlertModal.recordedPeak", "Pico registado")}</span>
            <span className={`new-alert-cell-value new-alert-cell-value--${current.tipo}`}>
              {pico !== null ? `${pico.toFixed(1)}°C` : "—"}
            </span>
          </div>
          <div className="new-alert-cell">
            <span className="new-alert-cell-label">{t("newAlertModal.initialTemp", "Temperatura inicial")}</span>
            <span className="new-alert-cell-value">
              {inicio !== null ? `${inicio.toFixed(1)}°C` : "—"}
            </span>
          </div>
          <div className="new-alert-cell">
            <span className="new-alert-cell-label">{t("newAlertModal.allowedRange", "Faixa permitida")}</span>
            <span className="new-alert-cell-value">
              {min !== null ? `${min.toFixed(1)}°C` : "—"} –{" "}
              {max !== null ? `${max.toFixed(1)}°C` : "—"}
            </span>
          </div>
          <div className="new-alert-cell">
            <span className="new-alert-cell-label">{t("newAlertModal.openedAt", "Aberto em")}</span>
            <span className="new-alert-cell-value new-alert-cell-value--meta">
              {formatWhen(current.aberto_at, currentLocale)}
            </span>
          </div>
        </div>

        <div className="new-alert-footer">
          {remaining > 0 && (
            <button
              type="button"
              className="new-alert-btn new-alert-btn--ghost"
              onClick={dismissAllNewAlerts}
            >
              {t("newAlertModal.dismissAll", "Dispensar todos ({{count}})", { count: pendingNewAlerts.length })}
            </button>
          )}
          {onOpenAlertasPage && (
            <button
              type="button"
              className="new-alert-btn new-alert-btn--secondary"
              onClick={() => {
                dismissCurrentNewAlert();
                onOpenAlertasPage();
              }}
            >
              {t("newAlertModal.viewInList", "Ver na lista")}
            </button>
          )}
          <button
            type="button"
            className={`new-alert-btn new-alert-btn--primary new-alert-btn--${current.tipo}`}
            onClick={dismissCurrentNewAlert}
            autoFocus
          >
            {remaining > 0
              ? t("newAlertModal.nextAlert", "Próximo alerta")
              : t("newAlertModal.gotIt", "Entendi")}
          </button>
        </div>
      </div>
    </div>
  );
}
