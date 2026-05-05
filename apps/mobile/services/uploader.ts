import NativeBackgroundLogger from '../modules/background-logger';
import { getPendingReadings, getJourneysByIds, markUploaded } from '../store/db';

// Set EXPO_PUBLIC_API_URL in .env for dev (e.g. http://localhost:8000).
// Defaults to production domain.
const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'https://viesambcobertura.cat';


// Matches the actual SQLite column names returned by getPendingReadings
type DbReading = {
  id: string;
  journey_id: string | null;
  timestamp: number;
  lat_grid: number | null;
  lng_grid: number | null;
  signal_dbm: number | null;
  rsrp: number | null;
  rsrq: number | null;
  sinr: number | null;
  network_type: string | null;
  mcc: string | null;
  mnc: string | null;
  speed_kmh: number | null;
  gps_accuracy: number | null;
  pci: number | null;
  earfcn: number | null;
  band: number | null;
  cqi: number | null;
  timing_advance: number | null;
  cell_count: number | null;
  last_ping_ms: number | null;
};

async function isServerReachable(): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5_000);
  const t0 = Date.now();
  try {
    const res = await fetch('https://clients3.google.com/generate_204', {
      method: 'HEAD',
      signal: controller.signal,
    });
    if (res.ok) {
      const latencyMs = Date.now() - t0;
      NativeBackgroundLogger.setLastPingMs(Date.now(), latencyMs).catch(() => {});
    }
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

const CHUNK_SIZE = 20;

function toPayloadReading(r: DbReading) {
  return {
    id: r.id,
    journey_id: r.journey_id ?? undefined,
    timestamp: new Date(r.timestamp).toISOString(),
    lat: r.lat_grid,
    lng: r.lng_grid,
    signal_dbm: r.signal_dbm,
    rsrp: r.rsrp,
    rsrq: r.rsrq,
    sinr: r.sinr,
    network_type: r.network_type,
    mcc: r.mcc,
    mnc: r.mnc,
    speed_kmh: r.speed_kmh,
    gps_accuracy: r.gps_accuracy,
    pci: r.pci,
    earfcn: r.earfcn,
    band: r.band,
    cqi: r.cqi,
    timing_advance: r.timing_advance,
    cell_count: r.cell_count,
    last_ping_ms: r.last_ping_ms,
    platform: 'android' as const,
    app_version: '0.1.0',
  };
}

export async function uploadPendingReadings(): Promise<{ uploaded: number; failed: number }> {
  if (!(await isServerReachable())) return { uploaded: 0, failed: 0 };

  const rows = (await getPendingReadings(500)) as unknown as DbReading[];
  if (rows.length === 0) return { uploaded: 0, failed: 0 };

  // Fetch journey metadata once for all rows (few journeys, many readings).
  const journeyIds = [...new Set(rows.map((r) => r.journey_id).filter(Boolean))] as string[];
  const journeyRows = await getJourneysByIds(journeyIds);
  const journeys = journeyRows.map((j) => ({
    id: j.id,
    started_at: new Date(j.started_at).toISOString(),
    ended_at: j.ended_at ? new Date(j.ended_at).toISOString() : null,
    platform: 'android' as const,
    app_version: '0.1.0',
  }));

  let uploaded = 0;
  let failed = 0;

  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);
    try {
      const res = await fetch(`${API_BASE}/api/v1/readings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          journeys: i === 0 ? journeys : [],
          readings: chunk.map(toPayloadReading),
        }),
      });
      if (!res.ok) { failed += chunk.length; break; }
      const result = (await res.json()) as { accepted: number; rejected: number };
      await markUploaded(chunk.map((r) => r.id));
      uploaded += result.accepted;
      failed += result.rejected;
    } catch {
      failed += chunk.length;
      break;
    }
  }

  return { uploaded, failed };
}
