import { NativeModule, requireNativeModule } from 'expo';

declare class BackgroundLoggerModule extends NativeModule {
  // Service control (sync)
  start(journeyId: string): void;
  stop(): void;
  isRunning(): boolean;

  // Journey (async)
  startJourney(id: string): Promise<void>;
  endJourney(id: string): Promise<void>;
  getJourneysByIds(ids: string[]): Promise<Record<string, unknown>[]>;

  // Readings (async)
  getReadingCount(): Promise<number>;
  getPendingReadingCount(): Promise<number>;
  getLastPingMs(): Promise<number | null>;
  getRecentPingMs(sinceMs: number): Promise<number[]>;
  setLastPingMs(ts: number, latencyMs: number): Promise<void>;
  getRecentReadings(sinceMs: number): Promise<Array<{ timestamp: number; signal_dbm: number | null; last_ping_ms: number | null }>>;
  getPendingReadings(limit: number): Promise<Record<string, unknown>[]>;
  markUploaded(ids: string[]): Promise<void>;
  getAllReadings(): Promise<Record<string, unknown>[]>;
}

export default requireNativeModule<BackgroundLoggerModule>('BackgroundLogger');
