import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getRecentReadings, type RecentReading } from '../store/db';
import NativeBackgroundLogger from '../modules/background-logger';
import { colors } from '../theme';
import { t } from '../i18n';

const WINDOW_MS = 5 * 60 * 1000;
const CHART_HEIGHT = 64;
function dbmToRatio(dbm: number): number {
  return Math.max(0, Math.min(1, (dbm + 120) / 70));
}

function barColor(dbm: number | null): string {
  if (dbm === null) return colors.neutralBorder;
  if (dbm > -85)  return '#4ade80';
  if (dbm > -100) return colors.secondary;
  return colors.primary;
}

function pingDotColor(readingTs: number, pings: number[]): string {
  return pings.some(p => Math.abs(readingTs - p) <= 12_000) ? '#22c55e' : colors.primary;
}

export default function SignalChart() {
  const [readings, setReadings] = useState<RecentReading[]>([]);
  const [pings, setPings] = useState<number[]>([]);

  async function refresh() {
    const since = Date.now() - WINDOW_MS;
    const [data, pingTs] = await Promise.all([
      getRecentReadings(since),
      NativeBackgroundLogger.getRecentPingMs(since),
    ]);
    setReadings(data);
    setPings(pingTs);
  }

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 10_000);
    return () => clearInterval(id);
  }, []);

  if (readings.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>{t.noDataYet}</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.chart}>
        {readings.map((r, i) => (
          <View key={i} style={styles.barWrapper}>
            <View
              style={[
                styles.bar,
                {
                  height: Math.max(2, dbmToRatio(r.signal_dbm ?? 0) * CHART_HEIGHT),
                  backgroundColor: barColor(r.signal_dbm),
                },
              ]}
            />
            <View style={[styles.pingMark, { backgroundColor: pingDotColor(r.timestamp, pings) }]} />
          </View>
        ))}
      </View>
      <View style={styles.labels}>
        <Text style={styles.labelText}>{t.minLabel}</Text>
        <Text style={styles.labelText}>{t.nowLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    paddingHorizontal: 4,
  },
  chart: {
    height: CHART_HEIGHT,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  barWrapper: {
    flex: 1,
    height: CHART_HEIGHT,
    justifyContent: 'flex-end',
  },
  bar: {
    borderRadius: 2,
    width: '100%',
  },
  pingMark: {
    position: 'absolute',
    bottom: -8,
    alignSelf: 'center',
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#22c55e',
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  labelText: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
  },
  empty: {
    height: CHART_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
  },
});
