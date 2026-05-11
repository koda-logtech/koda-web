import { useEffect, useMemo, useState } from "react";
import Button from "@components/common/Button";
import Loading from "@components/common/Loading";
import { useEntregasCompleto, useEntregaDirection } from "@controllers/entregaController";
import { useArmazens } from "@controllers/armazemController";
import type { Armazem, EntregaCompleta } from "@/types/models";
import type { PartnerWarehouse } from "@/types/partnerWarehouse";
import { entregaTemCoordsParaMapa, parseCoord } from "@/utils/entregaMap";
import DashboardMap, { type DashboardMapTrip } from "./DashboardMap";
import type { TripMapOverlayDetail } from "./TripMapOverlay";
import "./DashboardOverview.css";

const FETCH_LIMIT = 500;

const STATUS_ATIVOS = new Set(["pendente", "em_transito", "no_armazem"]);

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
  const band = span * 0.15;
  if (atual <= min + band || atual >= max - band) return "warn";
  return "neutral";
}

function formatTempDisplay(n: number): string {
  return `${Number.isInteger(n) ? String(n) : n.toFixed(1)}°C`;
}

function armazensAtivosComCoordenadas(rows: Armazem[]): PartnerWarehouse[] {
  return rows
    .filter((a) => a.is_ativo)
    .map((a) => ({
      id: String(a.id),
      nome: a.nome,
      endereco: a.endereco,
      latitude: Number(a.latitude),
      longitude: Number(a.longitude),
    }))
    .filter(
      (p) =>
        Number.isFinite(p.latitude) &&
        Number.isFinite(p.longitude) &&
        Math.abs(p.latitude) <= 90 &&
        Math.abs(p.longitude) <= 180,
    );
}

function toMapTrip(row: EntregaCompleta): DashboardMapTrip | null {
  if (!entregaTemCoordsParaMapa(row)) return null;
  const lo = parseCoord(row.longitude_carga);
  const la = parseCoord(row.latitude_carga);
  const ldo = parseCoord(row.longitude_cliente);
  const lda = parseCoord(row.latitude_cliente);
  if (lo === null || la === null || ldo === null || lda === null) return null;
  const placa = row.placa_caminhao?.trim() || "—";
  const modelo = row.modelo_caminhao?.trim();
  const modeloLabel = modelo ? `${placa} (${modelo})` : placa;
  return {
    id: String(row.id),
    placa,
    modeloLabel,
    current_longitude: lo,
    current_latitude: la,
    destino_nome: row.nome_cliente?.trim() || "Destino",
    destino_longitude: ldo,
    destino_latitude: lda,
    temperatura_atual: parseTemp(row.temperatura_atual),
    temperatura_minima: parseTemp(row.temperatura_minima),
    temperatura_maxima: parseTemp(row.temperatura_maxima),
  };
}

export default function DashboardOverview() {
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN?.trim();
  const hasMap = Boolean(mapboxToken);

  const [searchQuery, setSearchQuery] = useState("");
  const [locationInfo] = useState("São Paulo, SP");
  const [selectedEntregaId, setSelectedEntregaId] = useState<number | null>(null);
  const [showPartnerWarehouses, setShowPartnerWarehouses] = useState(false);

  const { data: entregasRaw = [], isLoading } = useEntregasCompleto(1, FETCH_LIMIT);
  const entregas = entregasRaw as EntregaCompleta[];

  const { data: armazensRaw = [] } = useArmazens(1, 100);
  const armazensParceirosMapa = useMemo(
    () => armazensAtivosComCoordenadas(armazensRaw as Armazem[]),
    [armazensRaw],
  );

  const liveTrips = useMemo(
    () => entregas.filter((e) => STATUS_ATIVOS.has(e.status) && entregaTemCoordsParaMapa(e)),
    [entregas],
  );

  const mapTrips = useMemo(
    () =>
      liveTrips
        .map(toMapTrip)
        .filter((t): t is DashboardMapTrip => t !== null),
    [liveTrips],
  );

  useEffect(() => {
    if (selectedEntregaId === null) return;
    if (liveTrips.some((t) => t.id === selectedEntregaId)) return;
    setSelectedEntregaId(null);
  }, [liveTrips, selectedEntregaId]);

  const toggleSelectEntrega = (id: number) => {
    setSelectedEntregaId((prev) => (prev === id ? null : id));
  };

  const tripOverlayDetail = useMemo((): TripMapOverlayDetail | null => {
    if (selectedEntregaId === null) return null;
    const row = liveTrips.find((r) => r.id === selectedEntregaId);
    if (!row) return null;
    return {
      motoristaNome: row.nome_motorista?.trim() || "—",
      motoristaAvatarUrl: row.motorista_avatar_url,
      placa: row.placa_caminhao?.trim() || "—",
      modelo: row.modelo_caminhao?.trim() ?? null,
      destinoNome: row.nome_cliente?.trim() || "Destino",
      destinoEndereco: row.endereco_cliente?.trim() ?? null,
      temperaturaAtual: parseTemp(row.temperatura_atual),
      temperaturaMin: parseTemp(row.temperatura_minima),
      temperaturaMax: parseTemp(row.temperatura_maxima),
    };
  }, [liveTrips, selectedEntregaId]);

  const directionEnabled =
    hasMap &&
    selectedEntregaId !== null &&
    liveTrips.some((t) => t.id === selectedEntregaId);

  const directionQuery = useEntregaDirection(selectedEntregaId, directionEnabled);

  const routeGeometry =
    directionQuery.data?.entrega_id === selectedEntregaId ? directionQuery.data.geometry : null;

  const selectedTripIdStr =
    selectedEntregaId !== null ? String(selectedEntregaId) : null;

  return (
    <div className="dashboard-overview">
      <header className="section-header">
        <div className="header-left">
          <div className="search-bar">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="Buscar veículo ou rota..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="header-right">
          <button className="icon-btn" title="Histórico">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </button>
          <button className="icon-btn" title="Notificações">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 01-3.46 0"></path></svg>
            <span className="notification-badge"></span>
          </button>
          <div className="user-profile">
            <img src="https://ui-avatars.com/api/?name=User&background=3498DB&color=fff" alt="User" />
          </div>
        </div>
      </header>

      <div className="page-top-actions">
        <div className="title-group">
          <h1>Visão Geral da Operação</h1>
          <p className="subtitle">Monitoramento em tempo real • {locationInfo}</p>
        </div>
        <div className="button-group">
          <Button variant="secondary" size="medium">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Exportar Relatórios
          </Button>
          <Button variant="primary" size="medium">+ Novo Manifesto</Button>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-header">
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
              className="metric-icon"
            >
              <rect x="1" y="3" width="15" height="13"></rect>
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
              <circle cx="5.5" cy="18.5" r="2.5"></circle>
              <circle cx="18.5" cy="18.5" r="2.5"></circle>
            </svg>
            <span className="metric-label">EM TRÂNSITO</span>
          </div>
          <h2 className="metric-value">42</h2>
          <span className="metric-subtext">Veículos em rota ativa</span>
        </div>

        <div className="metric-card warning">
          <div className="metric-header">
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
              className="metric-icon"
            >
              <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"></path>
            </svg>
            <span className="metric-label">RISCO TÉRMICO</span>
          </div>
          <h2 className="metric-value">05</h2>
          <span className="metric-subtext">Acima do limiar de segurança</span>
        </div>

        <div className="metric-card danger">
          <div className="metric-header">
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
              className="metric-icon"
            >
              <path d="M12 20v-8"></path>
              <path d="M17 20V8"></path>
              <path d="M22 4v16"></path>
              <path d="M2 20h.01"></path>
              <path d="M7 20v-4"></path>
              <line x1="1" y1="1" x2="23" y2="23"></line>
            </svg>
            <span className="metric-label">DESCONECTADOS</span>
          </div>
          <h2 className="metric-value">02</h2>
          <span className="metric-subtext">Sensores sem sinal &gt; 15 min</span>
        </div>

        <div className="metric-card dark-theme">
          <div className="metric-header">
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
              className="metric-icon"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <span className="metric-label">ALERTAS ATIVOS</span>
          </div>
          <h2 className="metric-value">12</h2>
          <span className="metric-subtext">Prioridade Alta (Nível 1)</span>
        </div>
      </div>

      <div className="main-overview-content">
        <div className="map-section">
          <div className="map-placeholder">
            {isLoading ? (
              <Loading message="Carregando dados..." />
            ) : hasMap ? (
              mapTrips.length > 0 ? (
                <DashboardMap
                  trips={mapTrips}
                  selectedTripId={selectedTripIdStr}
                  onSelectTrip={(id) => toggleSelectEntrega(Number(id))}
                  token={mapboxToken!}
                  routeGeometry={routeGeometry}
                  showPartnerWarehouses={showPartnerWarehouses}
                  onTogglePartnerWarehouses={() =>
                    setShowPartnerWarehouses((v) => !v)
                  }
                  partnerWarehouses={armazensParceirosMapa}
                  tripOverlay={tripOverlayDetail}
                  onCloseTripOverlay={() => setSelectedEntregaId(null)}
                />
              ) : (
                <div className="map-mock-bg">
                  <div className="map-text">Nenhuma viagem com coordenadas para exibir</div>
                </div>
              )
            ) : (
              <>
                <button type="button" className="map-layers-btn">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
                  Camadas de tráfego
                </button>

                <div className="map-zoom-controls">
                  <button type="button" className="map-control-btn">+</button>
                  <button type="button" className="map-control-btn">−</button>
                </div>

                <div className="map-live-indicator">
                  <span className="live-bullet"></span>
                  <strong>LIVE:</strong>{" "}
                  {liveTrips.length > 0 ? `${liveTrips.length} veículos em operação` : "Sem viagens com mapa"}
                </div>

                <div className="map-mock-bg">
                  <div className="vehicle-marker pulse-active" style={{ top: '30%', left: '40%' }}></div>
                  <div className="vehicle-marker pulse-warning" style={{ top: '55%', left: '60%' }}></div>
                  <div className="vehicle-marker pulse-active" style={{ top: '20%', left: '75%' }}></div>
                  <div className="vehicle-marker pulse-danger" style={{ top: '45%', left: '25%' }}></div>
                  <div className="map-text">Configure VITE_MAPBOX_TOKEN para o mapa</div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="monitoring-sidebar">
          <div className="sidebar-header-live">
            <h3>Monitoramento Live</h3>
            <button type="button" className="filter-btn" title="Filtrar">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
            </button>
          </div>

          <div className="live-cards-list">
            {isLoading ? (
              <Loading message="Carregando..." />
            ) : liveTrips.length === 0 ? (
              <p className="route-info" style={{ padding: "0.5rem 0" }}>
                Nenhuma viagem ativa com origem e destino geocodificados.
              </p>
            ) : (
              liveTrips.map((row) => {
                const tAtual = parseTemp(row.temperatura_atual);
                const tMin = parseTemp(row.temperatura_minima);
                const tMax = parseTemp(row.temperatura_maxima);
                const tk = tempKind(tAtual, tMin, tMax);
                const placa = row.placa_caminhao?.trim() ? row.placa_caminhao : "—";
                const modelo = row.modelo_caminhao?.trim();
                const vehicleLabel = modelo ? `${placa} (${modelo})` : placa;
                const cliente = row.nome_cliente?.trim() ? row.nome_cliente : "—";
                const endereco = row.endereco_cliente?.trim()
                  ? row.endereco_cliente
                  : "Sem endereço";
                const selected = selectedEntregaId === row.id;
                const cardExtra =
                  tk === "danger" ? " danger-border" : tk === "warn" ? " alert-border" : "";
                return (
                  <button
                    key={row.id}
                    type="button"
                    className={`live-card${cardExtra}${selected ? " live-card--selected" : ""}`}
                    onClick={() => toggleSelectEntrega(row.id)}
                  >
                    <div className="card-top">
                      <span className="vehicle-id">{vehicleLabel}</span>
                      <span
                        className={
                          tk === "danger"
                            ? "temp-info danger-text"
                            : tk === "warn"
                              ? "temp-info warning-text"
                              : tk === "none"
                                ? "temp-info temp-info--muted"
                                : "temp-info temp-info--ok"
                        }
                      >
                        {tAtual === null ? "—" : formatTempDisplay(tAtual)}
                      </span>
                    </div>
                    <p className="route-info">
                      {cliente} — {endereco}
                    </p>
                  </button>
                );
              })
            )}
          </div>

          <div className="sidebar-footer-action">
            <button type="button" className="view-all-btn">VER MANIFESTO COMPLETO</button>
          </div>
        </div>
      </div>
    </div>
  );
}
