import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { randomUUID } from 'expo-crypto';
import Telephony from '../modules/telephony';
import { insertReading } from '../store/db';
import { snapToGrid } from './journeyDetector';

export const LOCATION_TASK = 'railsignal-location';

// Registered at module level — must be called before the app renders.
TaskManager.defineTask(LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.warn('[RailSignal] location task error', error);
    return;
  }

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
});

// Simple in-memory journey ID shared with the task via module scope.
// Good enough for v0 — a foreground service restart resets it.
let currentJourneyId: string | null = null;

export function setJourneyId(id: string | null) {
  currentJourneyId = id;
}

export async function startLogging(journeyId: string): Promise<void> {
  currentJourneyId = journeyId;

  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') throw new Error('Foreground location permission denied');

  const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
  if (bgStatus !== 'granted') throw new Error('Background location permission denied');

  await Location.startLocationUpdatesAsync(LOCATION_TASK, {
    accuracy: Location.Accuracy.High,
    timeInterval: 10_000,         // poll every 10 s
    distanceInterval: 0,          // distance doesn't matter — time drives it
    foregroundService: {
      notificationTitle: 'RailSignal',
      notificationBody: 'Logging signal quality…',

    },
    // Keep GPS active even when the device is still
    pausesUpdatesAutomatically: false,
  });
}

export async function stopLogging(): Promise<void> {
  currentJourneyId = null;
  const isRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK);
  if (isRunning) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK);
  }
}

export async function isLogging(): Promise<boolean> {
  return Location.hasStartedLocationUpdatesAsync(LOCATION_TASK);
}
