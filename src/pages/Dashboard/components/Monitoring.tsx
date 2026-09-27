import { useEffect, useMemo, useState } from "react";
import Loading from "@components/common/Loading";
import { useTelemetriaAuditoriaPorCarga } from "@controllers/cargaController";
import { useEntregasCompleto, useEntregaDirection } from "@controllers/entregaController";
import { useArmazens } from "@controllers/armazemController";
import type { Armazem, EntregaCompleta } from "@/types/models";
import type { PartnerWarehouse } from "@/types/partnerWarehouse";
import { entregaTemCoordsParaMapa, parseCoord } from "@/utils/entregaMap";
import {
  DASHBOARD_LIVE_REFETCH_MS,
  STATUS_ATIVOS,
  parseTemp,
  entregaDesconectada,
} from "@/utils/dashboardOperationKpis";
import { buildCargaTraveledRoute } from "@/utils/buildCargaTraveledRoute";
import DashboardMap, { type DashboardMapTrip } from "./DashboardMap";
import type { TripMapOverlayDetail } from "./TripMapOverlay";
import "./DashboardOverview.css";
import "./Monitoring.css";

const FETCH_LIMIT = 500;

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

/**
 * Mesmo bloco de mapa do `DashboardOverview` (map-section / map-placeholder), em tela cheia na área principal.
 */
export default function Monitoring() {
  const mapboxToken = (window.__ENV__?.VITE_MAPBOX_TOKEN || import.meta.env.VITE_MAPBOX_TOKEN)?.trim();
  const hasMap = Boolean(mapboxToken);

  const [selectedEntregaId, setSelectedEntregaId] = useState<number | null>(null);
  const [showPartnerWarehouses, setShowPartnerWarehouses] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const { data: entregasRaw = [], isLoading } = useEntregasCompleto(1, FETCH_LIMIT, {
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

  return (
    <div className="monitoring-full-bleed">
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
                <div className="vehicle-marker pulse-active" style={{ top: "30%", left: "40%" }}></div>
                <div className="vehicle-marker pulse-warning" style={{ top: "55%", left: "60%" }}></div>
                <div className="vehicle-marker pulse-active" style={{ top: "20%", left: "75%" }}></div>
                <div className="vehicle-marker pulse-danger" style={{ top: "45%", left: "25%" }}></div>
                <div className="map-text">Configure VITE_MAPBOX_TOKEN para o mapa</div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
