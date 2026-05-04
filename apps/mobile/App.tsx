// Tasks must be registered before the app renders — expo-task-manager requirement.
import './services/backgroundLogger';
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
import { startLogging, stopLogging, isLogging } from './services/backgroundLogger';
import {
  startStationDetection,
  isStationDetectionRunning,
  requestNotificationPermission,
  getNearestStation,
  type NearestStation,
} from './services/stationDetector';
import { startJourney, endJourney, getReadingCount } from './store/db';
import { exportCsv } from './services/exporter';
import { uploadPendingReadings } from './services/uploader';
import { getNearestSection, type NearbySection } from './services/sectionDetector';
import { hasSeenOnboarding, markOnboardingDone } from './store/settings';
import Onboarding from './components/Onboarding';
import SignalChart from './components/SignalChart';
import { colors } from './theme';
import { t } from './i18n';

export default function App() {
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });

  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);
  const [logging, setLogging] = useState(false);
  const [journeyId, setJourneyId] = useState<string | null>(null);
  const [count, setCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [currentSection, setCurrentSection] = useState<NearbySection | null>(null);
  const [nearestStation, setNearestStation] = useState<NearestStation | null>(null);

  useEffect(() => {
    hasSeenOnboarding().then(setOnboardingDone);
    isLogging().then(setLogging);
    refreshCount();
  }, []);

  useEffect(() => {
    if (onboardingDone) initStationDetection();
  }, [onboardingDone]);

  useEffect(() => {
    if (!logging) {
      setCurrentSection(null);
      setNearestStation(null);
      return;
    }
    const timer = setInterval(refreshCount, 5_000);
    const sectionTimer = setInterval(refreshSection, 15_000);
    const uploadTimer = setInterval(() => uploadPendingReadings().catch(() => {}), 120_000);
    refreshSection();
    return () => {
      clearInterval(timer);
      clearInterval(sectionTimer);
      clearInterval(uploadTimer);
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
    setCount(await getReadingCount());
  }

  async function refreshSection() {
    const pos = await Location.getLastKnownPositionAsync();
    if (!pos) return;
    const { latitude, longitude } = pos.coords;
    setCurrentSection(getNearestSection(latitude, longitude));
    setNearestStation(getNearestStation(latitude, longitude));
  }

  async function handleToggle() {
    setBusy(true);
    try {
      if (logging) {
        await stopLogging();
        if (journeyId) await endJourney(journeyId);
        setJourneyId(null);
        setLogging(false);
        uploadPendingReadings().catch(() => {});
      } else {
        const id = randomUUID();
        await startJourney(id);
        await startLogging(id);
        setJourneyId(id);
        setLogging(true);
      }
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function handleExport() {
    try {
      await exportCsv();
    } catch (e: unknown) {
      Alert.alert('Export failed', e instanceof Error ? e.message : String(e));
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

      <View style={styles.counter}>
        <Text style={styles.counterValue}>{count}</Text>
        <Text style={styles.counterLabel}>{t.readingsStored}</Text>
      </View>

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

      {logging && <SignalChart />}

      <Pressable onPress={handleExport} style={styles.exportButton}>
        <Text style={styles.exportText}>{t.exportCsv}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    padding: 24,
  },
  counter: {
    alignItems: 'center',
  },
  counterValue: {
    fontSize: 64,
    fontFamily: 'Inter_700Bold',
    color: colors.text,
  },
  counterLabel: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
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
  exportButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.neutralBorder,
    backgroundColor: colors.white,
  },
  exportText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.textSecondary,
  },
});
