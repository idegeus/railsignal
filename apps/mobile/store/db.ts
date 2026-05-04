import * as SQLite from 'expo-sqlite';

const DB_NAME = 'railsignal.db';

let _db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync(DB_NAME);
  await migrate(_db);
  return _db;
}

async function migrate(db: SQLite.SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS journey (
      id            TEXT PRIMARY KEY,
      started_at    INTEGER NOT NULL,
      ended_at      INTEGER,
      reading_count INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS signal_reading (
      id              TEXT PRIMARY KEY,
      journey_id      TEXT REFERENCES journey(id),
      timestamp       INTEGER NOT NULL,
      lat             REAL,
      lng             REAL,
      lat_grid        REAL,
      lng_grid        REAL,
      signal_dbm      INTEGER,
      rsrp            INTEGER,
      rsrq            INTEGER,
      network_type    TEXT,
      mcc             TEXT,
      mnc             TEXT,
      operator_name   TEXT,
      roaming         INTEGER,
      android_version INTEGER,
      speed_kmh       REAL,
      upload_status   TEXT NOT NULL DEFAULT 'pending',
      uploaded_at     INTEGER
    );

    CREATE INDEX IF NOT EXISTS idx_reading_journey ON signal_reading(journey_id);
    CREATE INDEX IF NOT EXISTS idx_reading_upload  ON signal_reading(upload_status);
  `);
}

// ── Journeys ────────────────────────────────────────────────────────────────

export async function startJourney(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('INSERT INTO journey (id, started_at) VALUES (?, ?)', id, Date.now());
}

export async function endJourney(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE journey SET ended_at = ? WHERE id = ?', Date.now(), id);
}

export type DbJourney = {
  id: string;
  started_at: number;
  ended_at: number | null;
  reading_count: number;
};

export async function getJourneysByIds(ids: string[]): Promise<DbJourney[]> {
  if (ids.length === 0) return [];
  const db = await getDb();
  const placeholders = ids.map(() => '?').join(',');
  return db.getAllAsync<DbJourney>(
    `SELECT id, started_at, ended_at, reading_count FROM journey WHERE id IN (${placeholders})`,
    ...ids,
  );
}

// ── Readings ─────────────────────────────────────────────────────────────────

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
  networkType: string | null;
  mcc: string | null;
  mnc: string | null;
  operatorName: string | null;
  roaming: boolean;
  androidVersion: number;
  speedKmh: number | null;
};

export async function insertReading(r: ReadingInsert): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR IGNORE INTO signal_reading
       (id, journey_id, timestamp, lat, lng, lat_grid, lng_grid,
        signal_dbm, rsrp, rsrq, network_type, mcc, mnc,
        operator_name, roaming, android_version, speed_kmh)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    r.id, r.journeyId, r.timestamp,
    r.lat, r.lng, r.latGrid, r.lngGrid,
    r.signalDbm, r.rsrp, r.rsrq, r.networkType, r.mcc, r.mnc,
    r.operatorName, r.roaming ? 1 : 0, r.androidVersion, r.speedKmh,
  );
  if (r.journeyId) {
    await db.runAsync(
      'UPDATE journey SET reading_count = reading_count + 1 WHERE id = ?',
      r.journeyId,
    );
  }
}

export async function getPendingReadings(limit = 500) {
  const db = await getDb();
  return db.getAllAsync<ReadingInsert>(
    `SELECT * FROM signal_reading WHERE upload_status = 'pending' ORDER BY timestamp LIMIT ?`,
    limit,
  );
}

export async function markUploaded(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const db = await getDb();
  const placeholders = ids.map(() => '?').join(',');
  await db.runAsync(
    `UPDATE signal_reading SET upload_status = 'uploaded', uploaded_at = ? WHERE id IN (${placeholders})`,
    Date.now(),
    ...ids,
  );
}

export async function getReadingCount(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM signal_reading');
  return row?.count ?? 0;
}

export async function getAllReadings() {
  const db = await getDb();
  return db.getAllAsync<Record<string, unknown>>('SELECT * FROM signal_reading ORDER BY timestamp');
}

export type RecentReading = { timestamp: number; signal_dbm: number | null };

export async function getRecentReadings(sinceMs: number): Promise<RecentReading[]> {
  const db = await getDb();
  return db.getAllAsync<RecentReading>(
    'SELECT timestamp, signal_dbm FROM signal_reading WHERE timestamp > ? ORDER BY timestamp ASC',
    sinceMs,
  );
}

