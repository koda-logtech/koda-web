import { getTempStatus } from "@/utils/tempStatus";

export type TripMapOverlayDetail = {
  motoristaNome: string;
  motoristaAvatarUrl?: string | null;
  placa: string;
  modelo: string | null;
  destinoNome: string;
  destinoEndereco: string | null;
  temperaturaAtual: number | null;
  temperaturaMin: number | null;
  temperaturaMax: number | null;
  /** ISO timestamp da última telemetria recebida desta carga. */
  ultimaAtualizacaoAt?: string | null;
};

type Props = {
  detail: TripMapOverlayDetail;
  onClose: () => void;
};

function avatarFallbackUrl(nome: string): string {
  const safe = nome.trim() || "?";
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(safe)}&background=3498DB&color=fff&size=96`;
}

function resolveAvatarSrc(detail: TripMapOverlayDetail): string {
  const fromDb = detail.motoristaAvatarUrl?.trim();
  if (fromDb) return fromDb;
  return avatarFallbackUrl(detail.motoristaNome);
}

function tempClass(atual: number | null, min: number | null, max: number | null): string {
  if (atual === null || min === null || max === null) return "trip-map-overlay__temp trip-map-overlay__temp--muted";
  const st = getTempStatus(atual, min, max);
  if (st === "crit") return "trip-map-overlay__temp trip-map-overlay__temp--danger";
  if (st === "warn") return "trip-map-overlay__temp trip-map-overlay__temp--warn";
  return "trip-map-overlay__temp trip-map-overlay__temp--ok";
}

function formatAbsolute(iso: string): string {
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
}

function formatRelative(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "";
  const diffSec = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (diffSec < 60) return `há ${diffSec}s`;
  const min = Math.floor(diffSec / 60);
  if (min < 60) return `há ${min}min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.floor(h / 24);
  return `há ${d}d`;
}

/** 10 minutos sem telemetria → considera-se "desconectado". */
function isStale(iso: string | null | undefined): boolean {
  if (!iso) return true;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return true;
  return Date.now() - t > 10 * 60 * 1000;
}

export default function TripMapOverlay({ detail, onClose }: Props) {
  const tempLabel =
    detail.temperaturaAtual === null
      ? "—"
      : `${detail.temperaturaAtual.toFixed(1)}°C`;

  return (
    <div className="trip-map-overlay-wrap" aria-live="polite">
      <div className="trip-map-overlay" role="dialog" aria-label="Detalhes da viagem">
        <div className="trip-map-overlay__head">
          <div className="trip-map-overlay__who">
            <img
              src={resolveAvatarSrc(detail)}
              alt=""
              className="trip-map-overlay__avatar"
              loading="lazy"
            />
            <div className="trip-map-overlay__titles">
              <p className="trip-map-overlay__name">{detail.motoristaNome}</p>
              <p className="trip-map-overlay__vehicle">
                {detail.modelo ? (
                  <>
                    {detail.modelo} · <span className="trip-map-overlay__placa">{detail.placa}</span>
                  </>
                ) : (
                  <span className="trip-map-overlay__placa">{detail.placa}</span>
                )}
              </p>
            </div>
          </div>
          <button type="button" className="trip-map-overlay__close" onClick={onClose} aria-label="Fechar">
            ✕
          </button>
        </div>
        <p className="trip-map-overlay__label">Destino</p>
        <p className="trip-map-overlay__dest">{detail.destinoNome}</p>
        {detail.destinoEndereco ? (
          <p className="trip-map-overlay__addr">{detail.destinoEndereco}</p>
        ) : null}
        <div className="trip-map-overlay__temp-row">
          <span className="trip-map-overlay__temp-caption">Temperatura</span>
          <span className={tempClass(detail.temperaturaAtual, detail.temperaturaMin, detail.temperaturaMax)}>
            {tempLabel}
          </span>
        </div>
        <div
          className={`trip-map-overlay__updated-row${
            isStale(detail.ultimaAtualizacaoAt)
              ? " trip-map-overlay__updated-row--stale"
              : ""
          }`}
        >
          <span className="trip-map-overlay__temp-caption">Última atualização</span>
          {detail.ultimaAtualizacaoAt ? (
            <span
              className="trip-map-overlay__updated-value"
              title={formatAbsolute(detail.ultimaAtualizacaoAt)}
            >
              {formatAbsolute(detail.ultimaAtualizacaoAt)}
              <span className="trip-map-overlay__updated-rel">
                {" · "}
                {formatRelative(detail.ultimaAtualizacaoAt)}
              </span>
            </span>
          ) : (
            <span className="trip-map-overlay__updated-value trip-map-overlay__updated-value--muted">
              sem leitura
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
