import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { randomUUID } from 'expo-crypto';
import Telephony from '../modules/telephony';
import { insertReading } from '../store/db';
import { snapToGrid } from './journeyDetector';
import { saveActiveJourneyId, clearActiveJourneyId, getActiveJourneyId } from '../store/settings';
import { getNearestStation } from './stationDetector';
import { t } from '../i18n';

export const LOCATION_TASK = 'railsignal-location';

// Enforce a minimum gap between inserts even if Android fires the task faster
// than timeInterval (common with accuracy: High + distanceInterval: 0).
let lastInsertAt = 0;
const MIN_INTERVAL_MS = 8_000;

const TASK_OPTIONS: Location.LocationTaskOptions = {
  accuracy: Location.Accuracy.High, // Balanced batches at 30s and has no speed; debounce handles flooding
  timeInterval: 10_000,
  distanceInterval: 0,
  foregroundService: {
    notificationTitle: t.notificationTitle,
    notificationBody: t.notificationBody,
  },
  pausesUpdatesAutomatically: false,
};

function formatNotificationBody(signalDbm: number | null, networkType: string | null, lat: number, lng: number): string {
  const nearest = getNearestStation(lat, lng);
  const stationPart = nearest.distanceMetres < 1500
    ? ` · ${t.nearStation} ${nearest.name}`
    : '';
  const signalPart = signalDbm != null
    ? `${signalDbm} dBm${networkType ? ` (${networkType})` : ''}`
    : t.notificationBody;
  return `${signalPart}${stationPart}`;
}

// Registered at module level — must be called before the app renders.
TaskManager.defineTask(LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.warn('[RailSignal] location task error', error);
    return;
  }

  const now = Date.now();
  const gap = now - lastInsertAt;
  console.log(`[RailSignal] task fired — gap: ${gap} ms, journeyId: ${currentJourneyId}`);

  // Restore journeyId from durable storage if this is the first fire after a
  // JS restart (the native task survived but module-scope state reset to null).
  if (currentJourneyId === null) {
    try {
      const saved = await getActiveJourneyId();
      if (saved) currentJourneyId = saved;
    } catch (e) {
      console.warn('[RailSignal] failed to restore journeyId from storage', e);
    }
  }

  if (gap < MIN_INTERVAL_MS) {
    console.log(`[RailSignal] skipping — too soon (${gap} ms < ${MIN_INTERVAL_MS} ms)`);
    return;
  }
  lastInsertAt = now;

  const { locations } = data as { locations: Location.LocationObject[] };
  const loc = locations[0];
  if (!loc) return;

  const signal = Telephony.getSignalInfo();
  const speedKmh = loc.coords.speed != null && loc.coords.speed >= 0
    ? loc.coords.speed * 3.6
    : null;

  await insertReading({
    id: randomUUID(),
    journeyId: currentJourneyId,
    timestamp: loc.timestamp,
    lat: loc.coords.latitude,
    lng: loc.coords.longitude,
    latGrid: snapToGrid(loc.coords.latitude),
    lngGrid: snapToGrid(loc.coords.longitude),
    signalDbm: signal.signalDbm,
    rsrp: signal.rsrp,
    rsrq: signal.rsrq,
    networkType: signal.networkType,
    mcc: signal.mcc,
    mnc: signal.mnc,
    operatorName: signal.operatorName,
    roaming: signal.roaming,
    androidVersion: signal.androidVersion,
    speedKmh,
  });

  console.log(`[RailSignal] reading inserted — signal: ${signal.signalDbm} dBm, type: ${signal.networkType}`);

  // Update the foreground notification with live signal + nearest station.
  // Calling startLocationUpdatesAsync on a running task updates options in-place.
  try {
    const notificationBody = formatNotificationBody(
      signal.signalDbm,
      signal.networkType,
      loc.coords.latitude,
      loc.coords.longitude,
    );
    await Location.startLocationUpdatesAsync(LOCATION_TASK, {
      ...TASK_OPTIONS,
      foregroundService: {
        notificationTitle: t.notificationTitle,
        notificationBody,
      },
    });
  } catch {
    // Non-critical — logging continues even if the notification update fails.
  }
});

// Shared with the task via module scope; persisted to disk so it survives JS
// restarts where the native task keeps running.
let currentJourneyId: string | null = null;

export function setJourneyId(id: string | null) {
  currentJourneyId = id;
}

export async function startLogging(journeyId: string): Promise<void> {
  // Stop any existing task first — prevents double subscriptions after hot
  // reloads where React state resets but the native task keeps running.
  const alreadyRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK);
  if (alreadyRunning) {
    console.log('[RailSignal] startLogging: task already running, stopping first');
    await Location.stopLocationUpdatesAsync(LOCATION_TASK);
  }

  currentJourneyId = journeyId;
  lastInsertAt = 0;
  await saveActiveJourneyId(journeyId);

  // Android 13+ requires POST_NOTIFICATIONS at runtime for the foreground
  // service notification to appear. Best-effort — logging still works if denied.
  await Notifications.requestPermissionsAsync();

  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') throw new Error('Foreground location permission denied');

  const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
  if (bgStatus !== 'granted') throw new Error('Background location permission denied');

  await Location.startLocationUpdatesAsync(LOCATION_TASK, TASK_OPTIONS);

  console.log('[RailSignal] startLogging: task started');
}

export async function stopLogging(): Promise<void> {
  currentJourneyId = null;
  await clearActiveJourneyId();
  const isRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK);
  if (isRunning) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK);
  }
  console.log('[RailSignal] stopLogging: task stopped');
}

export async function isLogging(): Promise<boolean> {
  return Location.hasStartedLocationUpdatesAsync(LOCATION_TASK);
}
