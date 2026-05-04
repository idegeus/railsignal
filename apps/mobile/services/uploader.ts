import * as Network from 'expo-network';
import { getPendingReadings, getJourneysByIds, markUploaded } from '../store/db';

// Set EXPO_PUBLIC_API_URL in .env for dev (e.g. http://localhost:8000).
// Defaults to production domain.
const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'https://viesambcobertura.cat';

// Matches the actual SQLite column names returned by getAllAsync
type DbReading = {
  id: string;
  journey_id: string | null;
  timestamp: number;
  lat_grid: number | null;
  lng_grid: number | null;
  signal_dbm: number | null;
  network_type: string | null;
  mcc: string | null;
  mnc: string | null;
  speed_kmh: number | null;
};

export async function uploadPendingReadings(): Promise<{ uploaded: number; failed: number }> {
  const net = await Network.getNetworkStateAsync();
  if (!net.isInternetReachable) return { uploaded: 0, failed: 0 };

  const rows = (await getPendingReadings(500)) as unknown as DbReading[];
  if (rows.length === 0) return { uploaded: 0, failed: 0 };

  // Collect distinct journey IDs and fetch their metadata so the backend
  // can satisfy the FK constraint on signal_reading.journey_id.
  const journeyIds = [...new Set(rows.map((r) => r.journey_id).filter(Boolean))] as string[];
  const journeyRows = await getJourneysByIds(journeyIds);
  const journeys = journeyRows.map((j) => ({
    id: j.id,
    started_at: new Date(j.started_at).toISOString(),
    ended_at: j.ended_at ? new Date(j.ended_at).toISOString() : null,
    platform: 'android' as const,
    app_version: '0.1.0',
  }));

  const readings = rows.map((r) => ({
    id: r.id,
    journey_id: r.journey_id ?? undefined,
    timestamp: new Date(r.timestamp).toISOString(),
    lat: r.lat_grid,
    lng: r.lng_grid,
    signal_dbm: r.signal_dbm,
    network_type: r.network_type,
    mcc: r.mcc,
    mnc: r.mnc,
    speed_kmh: r.speed_kmh,
    platform: 'android' as const,
    app_version: '0.1.0',
  }));

  try {
    const res = await fetch(`${API_BASE}/api/v1/readings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ journeys, readings }),
    });
    if (!res.ok) return { uploaded: 0, failed: rows.length };
    const result = (await res.json()) as { accepted: number; rejected: number };
    await markUploaded(rows.map((r) => r.id));
    return { uploaded: result.accepted, failed: result.rejected };
  } catch {
    return { uploaded: 0, failed: rows.length };
  }
}
