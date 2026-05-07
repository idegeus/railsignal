import NativeBackgroundLogger from '../modules/background-logger';

// ── Journeys ─────────────────────────────────────────────────────────────────

export async function startJourney(id: string): Promise<void> {
  await NativeBackgroundLogger.startJourney(id);
}

export async function endJourney(id: string): Promise<void> {
  await NativeBackgroundLogger.endJourney(id);
}

export type DbJourney = {
  id: string;
  started_at: number;
  ended_at: number | null;
  reading_count: number;
};

export async function getJourneysByIds(ids: string[]): Promise<DbJourney[]> {
  const rows = await NativeBackgroundLogger.getJourneysByIds(ids);
  return rows as unknown as DbJourney[];
}

// ── Readings ──────────────────────────────────────────────────────────────────

export type ReadingInsert = {
  id: string;
  journeyId: string | null;
  timestamp: number;
  lat: number | null;
  lng: number | null;
  latGrid: number | null;
  lngGrid: number | null;
  signalDbm: number | null;
  rsrp: number | null;
  rsrq: number | null;
  sinr: number | null;
  networkType: string | null;
  mcc: string | null;
  mnc: string | null;
  operatorName: string | null;
  roaming: boolean;
  androidVersion: number;
  speedKmh: number | null;
  gpsAccuracy: number | null;
  pci: number | null;
  earfcn: number | null;
  band: number | null;
  cqi: number | null;
  timingAdvance: number | null;
  cellCount: number | null;
  lastPingMs: number | null;
  lastPingLatencyMs: number | null;
};

export async function getReadingCount(): Promise<number> {
  return NativeBackgroundLogger.getReadingCount();
}

export async function getPendingReadingCount(): Promise<number> {
  return NativeBackgroundLogger.getPendingReadingCount();
}

export async function getPendingReadings(limit = 500) {
  const rows = await NativeBackgroundLogger.getPendingReadings(limit);
  return rows as unknown[];
}

export async function markUploaded(ids: string[]): Promise<void> {
  await NativeBackgroundLogger.markUploaded(ids);
}

export async function getAllReadings() {
  const rows = await NativeBackgroundLogger.getAllReadings();
  return rows as Record<string, unknown>[];
}

export type RecentReading = { timestamp: number; signal_dbm: number | null; last_ping_ms: number | null };

export async function getRecentReadings(sinceMs: number): Promise<RecentReading[]> {
  return NativeBackgroundLogger.getRecentReadings(sinceMs);
}
