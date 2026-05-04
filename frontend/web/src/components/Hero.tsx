import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Polyline, Popup, ZoomControl, useMap } from 'react-leaflet';
import L, { LatLngBounds } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { R11_STATIONS, R11_SECTIONS, SIGNAL_COLORS, type Station } from '../data/r11';
import { useLang } from '../i18n';
import { useDownload } from './DownloadModal';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

type ReadingFeature = {
  geometry: { coordinates: [number, number] };
  properties: { signal_dbm: number | null };
};

function dbmColor(dbm: number | null): string {
  if (dbm === null) return '#9e9e9e';
  if (dbm > -85)  return SIGNAL_COLORS.good;
  if (dbm > -100) return SIGNAL_COLORS.fair;
  return SIGNAL_COLORS.poor;
}

function SignalLayer({ features }: { features: ReadingFeature[] }) {
  const map = useMap();

  useEffect(() => {
    if (features.length === 0) return;
    const renderer = L.canvas({ padding: 0.5 });
    const markers = features.map((f) => {
      const [lng, lat] = f.geometry.coordinates;
      return L.circleMarker([lat, lng], {
        renderer,
        radius: 5,
        weight: 0,
        fillColor: dbmColor(f.properties.signal_dbm),
        fillOpacity: 0.75,
      });
    });
    const layer = L.layerGroup(markers).addTo(map);
    return () => { map.removeLayer(layer); };
  }, [map, features]);

  return null;
}

function FitRoute() {
  const map = useMap();
  useEffect(() => {
    const lats = R11_STATIONS.map((s) => s.lat);
    const lngs = R11_STATIONS.map((s) => s.lng);
    const bounds = new LatLngBounds(
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)],
    );
    map.fitBounds(bounds, { padding: [48, 48] });
  }, [map]);
  return null;
}

function StationPopup({ station }: { station: Station }) {
  const { t } = useLang();
  const color = SIGNAL_COLORS[station.signal];
  const label = t(
    { good: 'Bona', fair: 'Variable', poor: 'Crítica' }[station.signal],
    { good: 'Buena', fair: 'Variable', poor: 'Crítica' }[station.signal],
    { good: 'Good', fair: 'Fair', poor: 'Critical' }[station.signal],
  );
  return (
    <div style={{ fontFamily: 'Inter, sans-serif', minWidth: 160 }}>
      <p style={{ fontWeight: 700, fontSize: 13, color: '#1a1c1c', margin: '0 0 8px' }}>
        {station.name}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color }}>
          {t('Cobertura', 'Cobertura', 'Coverage')} {label}
        </span>
      </div>
    </div>
  );
}

export default function Hero() {
  const { t } = useLang();
  const { openDownload } = useDownload();
  const [signalFeatures, setSignalFeatures] = useState<ReadingFeature[]>([]);

  useEffect(() => {
    fetch(`${API_BASE}/api/v1/export/geojson`)
      .then((r) => r.json())
      .then((data: { features: ReadingFeature[] }) => setSignalFeatures(data.features ?? []))
      .catch(() => {});
  }, []);

  const legendLabels = {
    good: t('Bona', 'Buena', 'Good'),
    fair: t('Variable', 'Variable', 'Fair'),
    poor: t('Crítica', 'Crítica', 'Critical'),
  };

  return (
    <section className="relative h-[85vh] min-h-[600px] w-full" id="mapa">
      <MapContainer
        center={[41.88, 2.72]}
        zoom={8}
        zoomControl={false}
        scrollWheelZoom={false}
        className="absolute inset-0 w-full h-full"
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
        />
        <ZoomControl position="bottomright" />
        <FitRoute />

        <SignalLayer features={signalFeatures} />

        {R11_SECTIONS.map((section, i) => (
          <Polyline
            key={i}
            positions={section.coords}
            color="#E30613"
            weight={2.5}
            dashArray="8 4"
            opacity={0.75}
          />
        ))}

        {R11_STATIONS.map((station) => (
          <CircleMarker
            key={station.id}
            center={[station.lat, station.lng]}
            radius={station.major ? 8 : 5}
            fillColor={SIGNAL_COLORS[station.signal]}
            color="white"
            weight={2}
            fillOpacity={0.9}
          >
            <Popup>
              <StationPopup station={station} />
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      {/* Mission card */}
      <div className="absolute top-10 left-4 md:left-10 z-[1000] max-w-[340px] md:max-w-md bg-white p-6 md:p-8 border-l-4 border-transit-red shadow-2xl">
        <div className="mb-3">
          <span className="bg-transit-yellow text-on-background px-2 py-0.5 text-xs font-bold uppercase tracking-widest">
            {t('Projecte Cívic', 'Proyecto Cívico', 'Civic Project')}
          </span>
        </div>
        <h1 className="text-[36px] md:text-h1 font-black text-on-surface tracking-tight leading-none mb-1">
          R11 Signal
        </h1>
        <p className="text-transit-red/70 text-xs font-bold uppercase tracking-widest mb-4">
          viesambcobertura.cat
        </p>
        <p className="text-on-surface-variant text-sm leading-relaxed mb-6">
          {t(
            "Monitoritzem la connectivitat mòbil a la xarxa ferroviària de Catalunya. Ajuda'ns a mapejar els punts negres de la línia R11.",
            'Monitorizamos la conectividad móvil en la red ferroviaria de Cataluña. Ayúdanos a mapear los puntos negros de la línea R11.',
            "We monitor mobile connectivity on the Catalan rail network. Help us map the dead zones on the R11 line.",
          )}
        </p>
        <button
          onClick={openDownload}
          className="inline-flex items-center gap-2 bg-transit-red text-white font-bold text-sm uppercase px-8 py-3.5 hover:bg-primary transition-colors shadow-lg shadow-transit-red/20"
        >
          <span className="material-symbols-outlined text-[15px]">download</span>
          {t("Baixa l'App per contribuir", 'Descarga la App para contribuir', 'Download the App to contribute')}
        </button>
      </div>

      {/* Map legend */}
      <div className="absolute bottom-8 left-4 md:left-10 z-[1000] bg-white/95 px-4 py-3 flex flex-col gap-2 shadow border border-surface-container">
        {(['good', 'fair', 'poor'] as const).map((level) => (
          <div key={level} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: SIGNAL_COLORS[level] }} />
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              {legendLabels[level]}
            </span>
          </div>
        ))}
      </div>

      <p className="absolute bottom-8 right-4 md:right-10 z-[1000] text-xs text-on-surface-variant/60 font-medium hidden md:block">
        {t('Fes clic a les estacions per veure el senyal', 'Haz clic en las estaciones para ver la señal', 'Click on stations to see the signal')}
      </p>
    </section>
  );
}
