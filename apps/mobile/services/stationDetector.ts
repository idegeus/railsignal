import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const stationsGeoJSON = require('../data/r11_stations.json') as {
  features: Array<{
    geometry: { coordinates: [number, number] }; // [lng, lat]
    properties: {
      stop_id: string;
      stop_name: string;
      stop_lat: number;
      stop_lon: number;
      section_appearances: number;
    };
  }>;
};

const GEOFENCE_TASK = 'railsignal-geofence';

// Larger radius for major interchange stations (many section appearances).
function radiusFor(sectionAppearances: number): number {
  return sectionAppearances >= 4 ? 450 : 300;
}

function stationNameFor(stopId: string): string {
  const feature = stationsGeoJSON.features.find(
    (f) => f.properties.stop_id === stopId,
  );
  return feature?.properties.stop_name ?? stopId;
}

// Keep notifications visible but silent.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

TaskManager.defineTask(GEOFENCE_TASK, async ({ data, error }) => {
  if (error) {
    console.warn('[RailSignal] geofence task error', error.message);
    return;
  }

  const { eventType, region } = data as {
    eventType: Location.GeofencingEventType;
    region: Location.LocationRegion;
  };

  if (eventType !== Location.GeofencingEventType.Enter) return;

  const stopId = region.identifier ?? '';
  const name = stationNameFor(stopId);

  Notifications.scheduleNotificationAsync({
    content: {
      title: '🚆 Train station nearby',
      body: `You're near ${name}. RailSignal will log signal quality on your journey.`,
      data: { stopId },
    },
    trigger: null,
  });
});

export async function requestNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function startStationDetection(): Promise<void> {
  const regions: Location.LocationRegion[] = stationsGeoJSON.features.map((f) => ({
    identifier: f.properties.stop_id,
    latitude: f.properties.stop_lat,
    longitude: f.properties.stop_lon,
    radius: radiusFor(f.properties.section_appearances),
    notifyOnEntry: true,
    notifyOnExit: false,
  }));

  await Location.startGeofencingAsync(GEOFENCE_TASK, regions);
}

export async function stopStationDetection(): Promise<void> {
  const running = await Location.hasStartedGeofencingAsync(GEOFENCE_TASK);
  if (running) await Location.stopGeofencingAsync(GEOFENCE_TASK);
}

export async function isStationDetectionRunning(): Promise<boolean> {
  return Location.hasStartedGeofencingAsync(GEOFENCE_TASK);
}
