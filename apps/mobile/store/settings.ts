import * as FileSystem from 'expo-file-system/legacy';

const MARKER = `${FileSystem.documentDirectory}.onboarding_done`;
const JOURNEY_FILE = `${FileSystem.documentDirectory}.active_journey_id`;

export async function hasSeenOnboarding(): Promise<boolean> {
  const info = await FileSystem.getInfoAsync(MARKER);
  return info.exists;
}

export async function markOnboardingDone(): Promise<void> {
  await FileSystem.writeAsStringAsync(MARKER, '1');
}

export async function saveActiveJourneyId(id: string): Promise<void> {
  await FileSystem.writeAsStringAsync(JOURNEY_FILE, id);
}

export async function clearActiveJourneyId(): Promise<void> {
  const info = await FileSystem.getInfoAsync(JOURNEY_FILE);
  if (info.exists) await FileSystem.deleteAsync(JOURNEY_FILE);
}

export async function getActiveJourneyId(): Promise<string | null> {
  const info = await FileSystem.getInfoAsync(JOURNEY_FILE);
  if (!info.exists) return null;
  return FileSystem.readAsStringAsync(JOURNEY_FILE);
}
