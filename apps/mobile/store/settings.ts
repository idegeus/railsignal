import * as FileSystem from 'expo-file-system/legacy';

const MARKER = `${FileSystem.documentDirectory}.onboarding_done`;

export async function hasSeenOnboarding(): Promise<boolean> {
  const info = await FileSystem.getInfoAsync(MARKER);
  return info.exists;
}

export async function markOnboardingDone(): Promise<void> {
  await FileSystem.writeAsStringAsync(MARKER, '1');
}
