import './services/stationDetector';

import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { randomUUID } from 'expo-crypto';
import * as Location from 'expo-location';
import NativeBackgroundLogger from './modules/background-logger';
import {
  startStationDetection,
  isStationDetectionRunning,
  requestNotificationPermission,
  getNearestStation,
  type NearestStation,
} from './services/stationDetector';
import { startJourney, endJourney, getReadingCount, getPendingReadingCount, getRecentReadings } from './store/db';
import { uploadPendingReadings } from './services/uploader';
import { getNearestSection, type NearbySection } from './services/sectionDetector';
import { hasSeenOnboarding, markOnboardingDone } from './store/settings';
import Onboarding from './components/Onboarding';
import SignalChart from './components/SignalChart';
import { colors } from './theme';
import { t } from './i18n';

function formatLastPing(ts: number): string {
  const diffSec = Math.floor((Date.now() - ts) / 1000);
  if (diffSec < 60) return t.pingJustNow;
  return `${Math.floor(diffSec / 60)} ${t.pingMinAgo}`;
}

function dbmToQuality(dbm: number | null): { label: string; color: string; bars: number } {
  if (dbm === null) return { label: t.signalNone,     color: colors.textMuted, bars: 0 };
  if (dbm > -75)   return { label: t.signalExcellent, color: '#22c55e',        bars: 5 };
  if (dbm > -85)   return { label: t.signalGood,      color: '#4ade80',        bars: 4 };
  if (dbm > -95)   return { label: t.signalFair,      color: '#fbbf24',        bars: 3 };
  if (dbm > -105)  return { label: t.signalPoor,      color: '#f97316',        bars: 2 };
  return                  { label: t.signalVeryPoor,  color: colors.primary,   bars: 1 };
}

function SignalIndicator({ dbm, active }: { dbm: number | null; active: boolean }) {
  const { label, color, bars } = active ? dbmToQuality(dbm) : { label: '—', color: colors.textMuted, bars: 0 };
  return (
    <View style={sigStyles.wrapper}>
      <View style={sigStyles.bars}>
        {[1, 2, 3, 4, 5].map(b => (
          <View
            key={b}
            style={[
              sigStyles.bar,
              { height: 6 + b * 7, backgroundColor: b <= bars ? color : colors.neutralBorder },
            ]}
          />
        ))}
      </View>
      <Text style={[sigStyles.label, { color }]}>{label}</Text>
      {active && dbm !== null && (
        <Text style={sigStyles.dbm}>{dbm} dBm</Text>
      )}
    </View>
  );
}

const sigStyles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    gap: 10,
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 5,
  },
  bar: {
    width: 14,
    borderRadius: 3,
  },
  label: {
    fontSize: 22,
    fontFamily: 'Inter_600SemiBold',
  },
  dbm: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
  },
});

export default function App() {
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });

  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);
  const [logging, setLogging] = useState(false);
  const [journeyId, setJourneyId] = useState<string | null>(null);
  const [count, setCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [currentSection, setCurrentSection] = useState<NearbySection | null>(null);
  const [nearestStation, setNearestStation] = useState<NearestStation | null>(null);
  const [lastDbm, setLastDbm] = useState<number | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastPingMs, setLastPingMs] = useState<number | null>(null);

  useEffect(() => {
    hasSeenOnboarding().then(setOnboardingDone);
    if (NativeBackgroundLogger.isRunning()) NativeBackgroundLogger.stop();
    setLogging(false);
    refreshCount();
    uploadPendingReadings().catch(() => {});
  }, []);

  useEffect(() => {
    if (onboardingDone) initStationDetection();
  }, [onboardingDone]);

  useEffect(() => {
    if (!logging) {
      setCurrentSection(null);
      setNearestStation(null);
      setLastDbm(null);
      return;
    }
    const timer = setInterval(refreshCount, 2_000);
    const sectionTimer = setInterval(refreshSection, 15_000);
    const signalTimer = setInterval(refreshSignal, 3_000);
    refreshSection();
    refreshSignal();
    return () => {
      clearInterval(timer);
      clearInterval(sectionTimer);
      clearInterval(signalTimer);
    };
  }, [logging]);

  async function initStationDetection() {
    const alreadyRunning = await isStationDetectionRunning();
    if (alreadyRunning) return;
    const granted = await requestNotificationPermission();
    if (!granted) return;
    try {
      await startStationDetection();
    } catch (e) {
      console.warn('[RailSignal] station detection failed to start', e);
    }
  }

  async function refreshCount() {
    const [total, pending] = await Promise.all([getReadingCount(), getPendingReadingCount()]);
    setCount(total);
    setPendingCount(pending);
    NativeBackgroundLogger.getLastPingMs().then(setLastPingMs).catch(() => {});
  }

  async function refreshSection() {
    const pos = await Location.getLastKnownPositionAsync();
    if (!pos) return;
    const { latitude, longitude } = pos.coords;
    setCurrentSection(getNearestSection(latitude, longitude));
    setNearestStation(getNearestStation(latitude, longitude));
  }

  async function refreshSignal() {
    const readings = await getRecentReadings(Date.now() - 30_000);
    const latest = readings[readings.length - 1];
    setLastDbm(latest?.signal_dbm ?? null);
  }

  async function handleToggle() {
    setBusy(true);
    try {
      if (logging) {
        NativeBackgroundLogger.stop();
        if (journeyId) await endJourney(journeyId);
        setJourneyId(null);
        setLogging(false);
        uploadPendingReadings().catch(() => {});
      } else {
        await requestNotificationPermission();

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') throw new Error('Foreground location permission denied');
        await Location.requestBackgroundPermissionsAsync();

        const id = randomUUID();
        await startJourney(id);
        NativeBackgroundLogger.start(id);
        setJourneyId(id);
        setLogging(true);
      }
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  if (onboardingDone === null || !fontsLoaded) return null;

  if (!onboardingDone) {
    return (
      <Onboarding
        onAccept={async () => {
          await markOnboardingDone();
          setOnboardingDone(true);
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.topSection}>
        <SignalIndicator dbm={lastDbm} active={logging} />
      </View>

      <View style={styles.middleSection}>
        {busy ? (
          <ActivityIndicator color={colors.primary} size="large" />
        ) : (
          <Pressable
            onPress={handleToggle}
            style={[styles.button, logging ? styles.buttonStop : styles.buttonStart]}
          >
            <Text style={styles.buttonText}>
              {logging ? t.stopLogging : t.startLogging}
            </Text>
          </Pressable>
        )}

        {logging && (
          <View style={styles.statusBlock}>
            <Text style={styles.statusText}>{t.recording}</Text>
            {currentSection ? (
              <Text style={styles.sectionText}>
                {currentSection.fromName} → {currentSection.toName}
              </Text>
            ) : nearestStation ? (
              <Text style={styles.sectionTextDim}>
                {t.nearStation} {nearestStation.name}
              </Text>
            ) : null}
          </View>
        )}
      </View>

      <View style={styles.bottomSection}>
        {logging && <SignalChart />}
        <Text style={styles.countText}>{count.toLocaleString()} {t.readingsStored}</Text>
        {pendingCount > 0 && (
          <Text style={styles.pingText}>{pendingCount.toLocaleString()} {t.pendingUpload}</Text>
        )}
        <Text style={styles.pingText}>
          {lastPingMs === null
            ? t.pingNever
            : `${t.lastPingLabel} ${formatLastPing(lastPingMs)}`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral,
    paddingHorizontal: 24,
    paddingTop: 72,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  topSection: {
    alignItems: 'center',
    paddingTop: 16,
  },
  middleSection: {
    alignItems: 'center',
    gap: 20,
  },
  bottomSection: {
    alignItems: 'center',
    gap: 12,
  },
  button: {
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 10,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonStart: {
    backgroundColor: colors.primary,
  },
  buttonStop: {
    backgroundColor: colors.inverted,
  },
  buttonText: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
    color: colors.white,
  },
  statusBlock: {
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.primary,
  },
  sectionText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.tertiary,
  },
  sectionTextDim: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textMuted,
  },
  countText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textMuted,
  },
  pingText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: colors.textMuted,
  },
});
