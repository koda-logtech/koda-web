import { useEffect, useMemo, useState } from "react";
import Button from "@components/common/Button";
import Loading from "@components/common/Loading";
import { useTelemetriaAuditoriaPorCarga } from "@controllers/cargaController";
import { useEntregasCompleto, useEntregaDirection } from "@controllers/entregaController";
import { useArmazens } from "@controllers/armazemController";
import { ALERTAS_LIVE_REFETCH_MS, useAlertasCount } from "@controllers/alertaController";
import { useRouteRecalculation } from "@/hooks/useRouteRecalculation";
import type { Armazem, EntregaCompleta } from "@/types/models";
import type { PartnerWarehouse } from "@/types/partnerWarehouse";
import { entregaTemCoordsParaMapa, parseCoord } from "@/utils/entregaMap";
import {
  DASHBOARD_LIVE_REFETCH_MS,
  STATUS_ATIVOS,
  parseTemp,
  tempKind,
  formatMetricKpi,
  computeOperationKpis,
  entregaDesconectada,
} from "@/utils/dashboardOperationKpis";
import { buildCargaTraveledRoute } from "@/utils/buildCargaTraveledRoute";
import { exportDashboardPdf } from "@/utils/exportDashboardPdf";
import { useToast } from "@/contexts/ToastContext";
import DashboardMap, { type DashboardMapTrip } from "./DashboardMap";
import type { TripMapOverlayDetail } from "./TripMapOverlay";
import "./DashboardOverview.css";

const FETCH_LIMIT = 500;

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

function toMapTrip(row: EntregaCompleta, nowMs: number): DashboardMapTrip | null {
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
    isDesconectada: entregaDesconectada(row, nowMs),
  };
}

export default function DashboardOverview() {
  const mapboxToken = (window.__ENV__?.VITE_MAPBOX_TOKEN || import.meta.env.VITE_MAPBOX_TOKEN)?.trim();
  const hasMap = Boolean(mapboxToken);
  const { addToast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEntregaId, setSelectedEntregaId] = useState<number | null>(null);
  const [showPartnerWarehouses, setShowPartnerWarehouses] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const { data: entregasRaw = [], isLoading, dataUpdatedAt } = useEntregasCompleto(1, FETCH_LIMIT, {
    refetchInterval: DASHBOARD_LIVE_REFETCH_MS,
    refetchIntervalInBackground: true,
  });
  const entregas = entregasRaw as EntregaCompleta[];

  const { data: armazensRaw = [] } = useArmazens(1, 100, {
    refetchInterval: DASHBOARD_LIVE_REFETCH_MS,
    refetchIntervalInBackground: true,
  });
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
        .map((row) => toMapTrip(row, nowMs))
        .filter((t): t is DashboardMapTrip => t !== null),
    [liveTrips, nowMs],
  );

  const { data: alertasAtivos = 0 } = useAlertasCount("aberto", {
    refetchInterval: ALERTAS_LIVE_REFETCH_MS,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });

  const kpis = useMemo(() => {
    const base = computeOperationKpis(entregas, nowMs);
    return { ...base, alertasAtivos };
  }, [entregas, nowMs, alertasAtivos]);

  const subtitleAtualizacao =
    dataUpdatedAt > 0
      ? new Date(dataUpdatedAt).toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      : "—";

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
      ultimaAtualizacaoAt: row.ultima_auditoria_at ?? null,
    };
  }, [liveTrips, selectedEntregaId]);

  const directionEnabled =
    hasMap &&
    selectedEntregaId !== null &&
    liveTrips.some((t) => t.id === selectedEntregaId);

  const directionQuery = useEntregaDirection(selectedEntregaId, directionEnabled);

  const routeGeometry =
    directionQuery.data?.entrega_id === selectedEntregaId ? directionQuery.data.geometry : null;

  // Coordenada atual da carga selecionada — usada para detectar desvio em tempo real.
  const selectedCargaLngLat = useMemo((): readonly [number, number] | null => {
    if (selectedEntregaId === null) return null;
    const trip = liveTrips.find((t) => t.id === selectedEntregaId);
    if (!trip) return null;
    const lng = parseCoord(trip.longitude_carga);
    const lat = parseCoord(trip.latitude_carga);
    if (lng === null || lat === null) return null;
    return [lng, lat];
  }, [liveTrips, selectedEntregaId]);

  useRouteRecalculation({
    selectedEntregaId,
    cargaLngLat: selectedCargaLngLat,
    routeGeometry,
    refetch: directionQuery.refetch,
  });

  const selectedTripIdStr =
    selectedEntregaId !== null ? String(selectedEntregaId) : null;

  const selectedCargaId = useMemo(() => {
    if (selectedEntregaId === null) return null;
    const row = liveTrips.find((r) => r.id === selectedEntregaId);
    const id = row?.id_carga;
    return typeof id === "number" && id > 0 ? id : null;
  }, [liveTrips, selectedEntregaId]);

  const auditoriaPorCarga = useTelemetriaAuditoriaPorCarga(selectedCargaId, {
    refetchInterval: selectedCargaId != null ? DASHBOARD_LIVE_REFETCH_MS : undefined,
  });

  const traveledRouteGeometry = useMemo(() => {
    if (selectedCargaId === null || auditoriaPorCarga.isLoading || auditoriaPorCarga.isError) {
      return null;
    }
    return buildCargaTraveledRoute(auditoriaPorCarga.data ?? []);
  }, [
    selectedCargaId,
    auditoriaPorCarga.data,
    auditoriaPorCarga.isError,
    auditoriaPorCarga.isLoading,
  ]);

  const handleExportPdf = () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      exportDashboardPdf({
        liveTrips,
        entregas,
        kpis,
        serverUpdatedAtMs: dataUpdatedAt,
        nowMs,
      });
      addToast({ message: "Relatório PDF gerado com sucesso.", type: "success" });
    } catch (err) {
      console.error("Falha ao gerar PDF:", err);
      addToast({ message: "Não foi possível gerar o PDF.", type: "error" });
    } finally {
      setIsExporting(false);
    }
  };

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
          {/* Sininho global de alertas é renderizado fixo via NotificationBell (Dashboard.tsx) */}
          {/* <div className="user-profile">
            <img src="https://ui-avatars.com/api/?name=User&background=3498DB&color=fff" alt="User" />
          </div> */}
        </div>
      </header>

      <div className="page-top-actions">
        <div className="title-group">
          <h1>Visão Geral da Operação</h1>
          <p className="subtitle">
            Monitoramento ao vivo • Dados do servidor às {subtitleAtualizacao} • Atualização a cada{" "}
            {DASHBOARD_LIVE_REFETCH_MS / 1000}s
          </p>
        </div>
        <div className="button-group">
          <Button
            variant="secondary"
            size="medium"
            onClick={handleExportPdf}
            disabled={isExporting || isLoading}
            title="Baixar PDF com a foto atual da operação"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            {isExporting ? "Gerando..." : "Exportar Relatórios"}
          </Button>
          {/* <Button variant="primary" size="medium">+ Novo Manifesto</Button> */}
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
          <h2 className="metric-value">{formatMetricKpi(kpis.emTransito)}</h2>
          <span className="metric-subtext">Viagens ativas com mapa (lista Monitoramento Live)</span>
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
          <h2 className="metric-value">{formatMetricKpi(kpis.riscoTermico)}</h2>
          <span className="metric-subtext">Temperatura fora do mínimo/máximo da carga</span>
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
          <h2 className="metric-value">{formatMetricKpi(kpis.desconectados)}</h2>
          <span className="metric-subtext">Sem telemetria ou última leitura há mais de 10 min</span>
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
          <h2 className="metric-value">{formatMetricKpi(kpis.alertasAtivos)}</h2>
          <span className="metric-subtext">Prioridade Alta</span>
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
                  traveledRouteGeometry={traveledRouteGeometry}
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
            {/* <button type="button" className="filter-btn" title="Filtrar">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
            </button> */}
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
                const isDesconectada = entregaDesconectada(row, nowMs);

                // Prioridade da borda:
                // offline (ou sem leitura) → cinza ; senão, sinal térmico:
                // danger=vermelho, warn=amarelo, neutral=verde.
                let borderClass = "";
                if (isDesconectada || tk === "none") borderClass = " offline-border";
                else if (tk === "danger") borderClass = " danger-border";
                else if (tk === "warn") borderClass = " alert-border";
                else borderClass = " ok-border";
                return (
                  <button
                    key={row.id}
                    type="button"
                    className={`live-card${borderClass}${selected ? " live-card--selected" : ""}`}
                    onClick={() => toggleSelectEntrega(row.id)}
                  >
                    <div className="card-top">
                      <span className="vehicle-id">
                        {vehicleLabel}
                        {isDesconectada && (
                          <span
                            className="live-card-disconnected"
                            title="Sem telemetria há mais de 10 minutos"
                            aria-label="Sem telemetria há mais de 10 minutos"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden
                            >
                              <line x1="1" y1="1" x2="23" y2="23" />
                              <path d="M16.72 11.06A10.94 10.94 0 0119 12.55" />
                              <path d="M5 12.55a10.94 10.94 0 015.17-2.39" />
                              <path d="M10.71 5.05A16 16 0 0122.58 9" />
                              <path d="M1.42 9a15.91 15.91 0 014.7-2.88" />
                              <path d="M8.53 16.11a6 6 0 016.95 0" />
                              <line x1="12" y1="20" x2="12.01" y2="20" />
                            </svg>
                            Desconectado
                          </span>
                        )}
                      </span>
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
                    {/* {selected && (
                      <pre className="live-card-auditoria-pings" aria-label="Histórico de telemetria da carga">
                        {auditoriaMultiline}
                      </pre>
                    )} */}
                  </button>
                );
              })
            )}
          </div>

          {/* <div className="sidebar-footer-action">
            <button type="button" className="view-all-btn">VER MANIFESTO COMPLETO</button>
          </div> */}
        </div>
      </div>
    </div>
  );
}
