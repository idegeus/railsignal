import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { getAllReadings } from '../store/db';

const HEADERS = [
  'id', 'journey_id', 'timestamp', 'lat', 'lng', 'lat_grid', 'lng_grid',
  'signal_dbm', 'rsrp', 'rsrq', 'network_type', 'mcc', 'mnc',
  'operator_name', 'roaming', 'android_version', 'speed_kmh', 'upload_status',
].join(',');

function toCsvLine(values: unknown[]): string {
  return values.map((v) => (v == null ? '' : String(v))).join(',');
}

export async function exportCsv(): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const readings = await getAllReadings();
  const lines = readings.map((r) =>
    toCsvLine([
      r.id, r.journey_id, r.timestamp,
      r.lat, r.lng, r.lat_grid, r.lng_grid,
      r.signal_dbm, r.rsrp, r.rsrq, r.network_type, r.mcc, r.mnc,
      r.operator_name, r.roaming, r.android_version, r.speed_kmh,
      r.upload_status,
    ]),
  );
  const path = `${FileSystem.cacheDirectory!}railsignal_readings_${timestamp}.csv`;
  await FileSystem.writeAsStringAsync(
    path,
    [HEADERS, ...lines].join('\n'),
    { encoding: FileSystem.EncodingType.UTF8 },
  );
  await Sharing.shareAsync(path, {
    mimeType: 'text/csv',
    dialogTitle: `Export RailSignal — ${readings.length} readings`,
  });
}
