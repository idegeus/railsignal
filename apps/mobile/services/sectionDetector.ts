// eslint-disable-next-line @typescript-eslint/no-require-imports
const sectionsGeoJSON = require('../data/r11_sections.json') as {
  features: Array<{
    geometry: { coordinates: [number, number][] };
    properties: {
      from_stop_id: string;
      to_stop_id: string;
      from_stop_name: string;
      to_stop_name: string;
    };
  }>;
};

type SectionEntry = {
  fromId: string;
  toId: string;
  fromName: string;
  toName: string;
  coords: [number, number][]; // [lng, lat] GeoJSON order
};

// Parsed once at module load — cheap since it's bundled JSON.
const SECTIONS: SectionEntry[] = sectionsGeoJSON.features.map((f) => ({
  fromId: f.properties.from_stop_id,
  toId: f.properties.to_stop_id,
  fromName: f.properties.from_stop_name,
  toName: f.properties.to_stop_name,
  coords: f.geometry.coordinates,
}));

export type NearbySection = {
  fromName: string;
  toName: string;
  distanceMetres: number;
};

const THRESHOLD_M = 150;

export function getNearestSection(lat: number, lng: number): NearbySection | null {
  let nearest: NearbySection | null = null;
  let best = THRESHOLD_M;

  for (const section of SECTIONS) {
    const d = minDistToLine(lat, lng, section.coords);
    if (d < best) {
      best = d;
      nearest = { fromName: section.fromName, toName: section.toName, distanceMetres: d };
    }
  }

  return nearest;
}

function minDistToLine(lat: number, lng: number, coords: [number, number][]): number {
  let min = Infinity;
  for (const [cLng, cLat] of coords) {
    const d = haversine(lat, lng, cLat, cLng);
    if (d < min) min = d;
  }
  return min;
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000;
  const toRad = Math.PI / 180;
  const dLat = (lat2 - lat1) * toRad;
  const dLng = (lng2 - lng1) * toRad;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
