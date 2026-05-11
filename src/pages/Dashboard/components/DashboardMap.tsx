import { useLayoutEffect, useRef } from 'react';
import MapBox, { Layer, Marker, NavigationControl, Source } from 'react-map-gl/mapbox';
import type { MapRef } from 'react-map-gl/mapbox';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

import type { LineStringGeometry } from '@/types/models';
import type { PartnerWarehouse } from '@/types/partnerWarehouse';
import { getTempStatus } from '@/utils/tempStatus';
import TripMapOverlay, { type TripMapOverlayDetail } from './TripMapOverlay';

import './DashboardMap.css';

const BR_VIEW = {
  longitude: -51.9253,
  latitude: -14.235,
  zoom: 2.35,
};

export type DashboardMapTrip = {
  id: string;
  placa: string;
  modeloLabel: string;
  current_longitude: number;
  current_latitude: number;
  destino_nome: string;
  destino_longitude: number;
  destino_latitude: number;
  temperatura_atual: number | null;
  temperatura_minima: number | null;
  temperatura_maxima: number | null;
};

type Props = {
  trips: DashboardMapTrip[];
  selectedTripId: string | null;
  onSelectTrip: (id: string) => void;
  token: string;
  routeGeometry: LineStringGeometry | null;
  showPartnerWarehouses: boolean;
  onTogglePartnerWarehouses: () => void;
  partnerWarehouses: PartnerWarehouse[];
  tripOverlay: TripMapOverlayDetail | null;
  onCloseTripOverlay: () => void;
};

function markerClassForTrip(t: DashboardMapTrip): string {
  const { temperatura_atual: a, temperatura_minima: mi, temperatura_maxima: ma } = t;
  if (a === null || mi === null || ma === null) return 'dashboard-map-marker--neutral';
  const st = getTempStatus(a, mi, ma);
  if (st === 'ok') return 'dashboard-map-marker--ok';
  if (st === 'warn') return 'dashboard-map-marker--warn';
  return 'dashboard-map-marker--crit';
}

function RouteLayer({ geometry }: { geometry: LineStringGeometry }) {
  return (
    <Source id="trip-route-line" type="geojson" data={{ type: 'Feature', properties: {}, geometry }}>
      <Layer
        id="trip-route-line-layer"
        type="line"
        layout={{ 'line-cap': 'round', 'line-join': 'round' }}
        paint={{
          'line-color': '#60a5fa',
          'line-width': 4,
          'line-opacity': 0.92,
        }}
      />
    </Source>
  );
}

function DestinationPin({ lng, lat, label }: { lng: number; lat: number; label: string }) {
  const cells = 5;
  const size = 16;
  const cell = size / cells;
  return (
    <Marker longitude={lng} latitude={lat} anchor="center">
      <div className="dashboard-map-dest-wrap" role="img" aria-label={`Destino: ${label}`}>
        <div className="dashboard-map-dest-grid">
          <svg viewBox={`0 0 ${size} ${size}`} width="100%" height="100%" aria-hidden>
            {Array.from({ length: cells * cells }, (_, i) => {
              const row = Math.floor(i / cells);
              const col = i % cells;
              const dark = (row + col) % 2 === 0;
              return (
                <rect
                  key={i}
                  x={col * cell}
                  y={row * cell}
                  width={cell}
                  height={cell}
                  fill={dark ? '#171717' : '#f5f5f5'}
                />
              );
            })}
          </svg>
        </div>
      </div>
    </Marker>
  );
}

function WarehouseMarkers({ warehouses }: { warehouses: PartnerWarehouse[] }) {
  return (
    <>
      {warehouses.map((w) => (
        <Marker key={w.id} longitude={w.longitude} latitude={w.latitude} anchor="center">
          <div
            className="pointer-events-none"
            title={w.endereco ? `${w.nome} — ${w.endereco}` : w.nome}
            role="img"
            aria-label={w.nome}
          >
            <div className="dashboard-map-wh-icon">
              <svg viewBox="0 0 24 24" aria-hidden>
                <path d="M12 3 2 9v12h6v-8h4v8h8V9L12 3zm0 2.8 5.5 3.7v1H6.5v-1L12 5.8zM8 18v-6h8v6h-2v-4h-4v4H8z" />
              </svg>
            </div>
          </div>
        </Marker>
      ))}
    </>
  );
}

function TripMarkers({
  trips,
  selectedTripId,
  onSelectTrip,
}: {
  trips: DashboardMapTrip[];
  selectedTripId: string | null;
  onSelectTrip: (id: string) => void;
}) {
  return (
    <>
      {trips.map((trip) => {
        const cls = markerClassForTrip(trip);
        const sel = selectedTripId === trip.id;
        return (
          <Marker key={trip.id} longitude={trip.current_longitude} latitude={trip.current_latitude} anchor="center">
            <button
              type="button"
              className={`dashboard-map-marker ${cls}${sel ? ' dashboard-map-marker--selected' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onSelectTrip(trip.id);
              }}
              title={trip.modeloLabel}
              aria-label={`Caminhão ${trip.placa}`}
            />
          </Marker>
        );
      })}
    </>
  );
}

export default function DashboardMap({
  trips,
  selectedTripId,
  onSelectTrip,
  token,
  routeGeometry,
  showPartnerWarehouses,
  onTogglePartnerWarehouses,
  partnerWarehouses,
  tripOverlay,
  onCloseTripOverlay,
}: Props) {
  const mapRef = useRef<MapRef>(null);
  const fitGenerationRef = useRef(0);

  const selectedTrip = trips.find((t) => t.id === selectedTripId);

  useLayoutEffect(() => {
    if (!selectedTripId || !routeGeometry?.coordinates?.length) return;
    const coords = routeGeometry.coordinates;
    const runId = ++fitGenerationRef.current;
    const fitOptions = {
      padding: { top: 100, bottom: 160, left: 100, right: 100 },
      duration: 750,
      maxZoom: 14,
      essential: true,
    } as const;

    const applyFit = () => {
      if (runId !== fitGenerationRef.current) return;
      const map = mapRef.current?.getMap();
      if (!map) return;
      const bounds = new mapboxgl.LngLatBounds();
      coords.forEach((c) => bounds.extend(c as [number, number]));
      try {
        map.resize();
        map.fitBounds(bounds, fitOptions);
      } catch {
        /* ignore */
      }
    };

    const timerId = window.setTimeout(applyFit, 0);
    return () => window.clearTimeout(timerId);
  }, [selectedTripId, routeGeometry]);

  return (
    <div className="dashboard-map-root">
      <MapBox
        ref={mapRef}
        mapboxAccessToken={token}
        initialViewState={BR_VIEW}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        style={{ width: "100%", height: "100%" }}
        attributionControl={false}
      >
        <NavigationControl position="bottom-right" showCompass={false} />
        {routeGeometry && selectedTrip && <RouteLayer geometry={routeGeometry} />}
        {showPartnerWarehouses && <WarehouseMarkers warehouses={partnerWarehouses} />}
        <TripMarkers trips={trips} selectedTripId={selectedTripId} onSelectTrip={onSelectTrip} />
        {routeGeometry && selectedTrip && (
          <DestinationPin
            lng={selectedTrip.destino_longitude}
            lat={selectedTrip.destino_latitude}
            label={selectedTrip.destino_nome}
          />
        )}
      </MapBox>

      <div className="dashboard-map-overlay-col">
        <div className="dashboard-map-overlay-row">
          <button type="button" className="dashboard-map-chip">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
            Camadas de tráfego
          </button>
          <button
            type="button"
            className={`dashboard-map-chip${showPartnerWarehouses ? ' dashboard-map-chip--on' : ''}`}
            onClick={onTogglePartnerWarehouses}
            aria-pressed={showPartnerWarehouses}
          >
            Armazéns parceiros
          </button>
        </div>
      </div>

      {!selectedTripId ? (
        <div className="dashboard-map-live">
          <span className="dashboard-map-live-dot" />
          <span>
            <strong style={{ marginRight: '0.35rem' }}>LIVE:</strong>
            {trips.length} veículos em operação
          </span>
        </div>
      ) : null}

      {tripOverlay ? (
        <TripMapOverlay detail={tripOverlay} onClose={onCloseTripOverlay} />
      ) : null}
    </div>
  );
}
