import stationsGeoJson from './r11_stations.json';
import sectionsGeoJson from './r11_sections.json';

export type SignalLevel = 'good' | 'fair' | 'poor';

export type Station = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  signal: SignalLevel;
  major: boolean;
};

export const SIGNAL_COLORS: Record<SignalLevel, string> = {
  good: '#2D8A2D',
  fair: '#E8A000',
  poor: '#E30613',
};

export const SIGNAL_LABELS: Record<SignalLevel, string> = {
  good: 'Bona',
  fair: 'Variable',
  poor: 'Crítica',
};

const MOCK_SIGNAL: Record<string, SignalLevel> = {
  '71801': 'good', '71802': 'good', '79004': 'good', '79009': 'good',
  '79100': 'good', '79104': 'fair', '79105': 'fair', '79106': 'fair',
  '79107': 'poor', '79200': 'poor', '79202': 'fair', '79203': 'fair',
  '79204': 'good', '79205': 'good', '79300': 'good', '79301': 'fair',
  '79302': 'fair', '79303': 'fair', '79304': 'poor', '79305': 'poor',
  '79306': 'poor', '79308': 'fair', '79309': 'good', '79311': 'poor',
  '79312': 'fair', '79314': 'poor', '79315': 'poor', '79316': 'poor',
};

const MAJOR = new Set(['71801', '79300', '79309', '79315', '79316']);

export const R11_STATIONS: Station[] = stationsGeoJson.features
  .filter((f) => f.properties.stop_id !== '79607')
  .map((f) => ({
  id: f.properties.stop_id,
  name: f.properties.stop_name,
  lat: f.properties.stop_lat,
  lng: f.properties.stop_lon,
  signal: MOCK_SIGNAL[f.properties.stop_id] ?? 'fair',
  major: MAJOR.has(f.properties.stop_id),
}));

// Each section is a GeoJSON LineString — coordinates are [lng, lat]
export type RouteSection = {
  fromName: string;
  toName: string;
  coords: [number, number][]; // [lat, lng] for Leaflet
};

export const R11_SECTIONS: RouteSection[] = sectionsGeoJson.features.map((f) => ({
  fromName: f.properties.from_stop_name,
  toName: f.properties.to_stop_name,
  // GeoJSON is [lng, lat]; Leaflet expects [lat, lng]
  coords: (f.geometry.coordinates as [number, number][]).map(([lng, lat]) => [lat, lng]),
}));
