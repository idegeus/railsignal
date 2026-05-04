import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getRecentReadings, type RecentReading } from '../store/db';
import { colors } from '../theme';
import { t } from '../i18n';

const WINDOW_MS = 5 * 60 * 1000;
const CHART_HEIGHT = 64;

// dBm range used for bar height: -120 (floor) to -50 (ceiling)
function dbmToRatio(dbm: number): number {
  return Math.max(0, Math.min(1, (dbm + 120) / 70));
}

function barColor(dbm: number | null): string {
  if (dbm === null) return colors.neutralBorder;
  if (dbm > -85)  return '#4ade80'; // good
  if (dbm > -100) return colors.secondary; // fair
  return colors.primary; // poor
}

export default function SignalChart() {
  const [readings, setReadings] = useState<RecentReading[]>([]);

  async function refresh() {
    const since = Date.now() - WINDOW_MS;
    setReadings(await getRecentReadings(since));
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
        {readings.map((r, i) => {
          const ratio = r.signal_dbm !== null ? dbmToRatio(r.signal_dbm) : 0.03;
          return (
            <View key={i} style={styles.barWrapper}>
              <View
                style={[
                  styles.bar,
                  {
                    height: Math.max(2, ratio * CHART_HEIGHT),
                    backgroundColor: barColor(r.signal_dbm),
                  },
                ]}
              />
            </View>
          );
        })}
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
    justifyContent: 'flex-end',
  },
  bar: {
    borderRadius: 2,
    width: '100%',
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
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
