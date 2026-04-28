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
      </div>
    </div>
  );
}
