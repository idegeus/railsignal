import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { colors } from '../theme';

type Props = {
  onAccept: () => void;
};

const COLLECTED = [
  { icon: '📍', text: 'GPS location while the app is logging' },
  { icon: '📶', text: 'Mobile signal strength (dBm) and network type (4G, 5G, …)' },
  { icon: '🌐', text: 'Mobile operator and country code (e.g. Orange ES)' },
  { icon: '🔁', text: 'Whether your SIM is roaming' },
  { icon: '⚡', text: 'Your speed — to confirm you are on a moving train' },
];

const NOT_COLLECTED = [
  'Your name, phone number, or account',
  'Who you call, text, or message',
  'Which apps you use or websites you visit',
  'Anything when the app is not running',
];

export default function Onboarding({ onAccept }: Props) {
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });

  if (!fontsLoaded) return null;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Before you start</Text>
        </View>

        <Text style={styles.title}>What this app records</Text>
        <Text style={styles.intro}>
          RailSignal measures mobile signal quality on train routes and contributes
          that data to a shared, public dataset. Here is exactly what it records.
        </Text>

        <Text style={styles.sectionTitle}>Recorded while logging</Text>
        {COLLECTED.map(({ icon, text }) => (
          <View key={text} style={styles.row}>
            <View style={styles.iconWrap}>
              <Text style={styles.icon}>{icon}</Text>
            </View>
            <Text style={styles.rowText}>{text}</Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Never recorded</Text>
        {NOT_COLLECTED.map((text) => (
          <View key={text} style={styles.row}>
            <View style={[styles.iconWrap, styles.iconWrapMuted]}>
              <Text style={styles.iconMuted}>✕</Text>
            </View>
            <Text style={styles.rowTextMuted}>{text}</Text>
          </View>
        ))}

        <View style={styles.note}>
          <Text style={styles.noteText}>
            Recordings only happen while you tap{' '}
            <Text style={styles.noteBold}>Start logging</Text>. Location is snapped
            to a ~50 m grid before storage — exact coordinates are never saved.
            All data will be published as open data.
          </Text>
        </View>

        <Pressable style={styles.button} onPress={onAccept}>
          <Text style={styles.buttonText}>I understand — let's go</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scroll: {
    padding: 28,
    paddingTop: 64,
    paddingBottom: 48,
    gap: 12,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.secondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 4,
  },
  badgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: colors.text,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    color: colors.text,
    marginBottom: 4,
  },
  intro: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 8,
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 12,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.neutral,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  iconWrapMuted: {
    backgroundColor: colors.neutralBorder,
  },
  icon: {
    fontSize: 16,
  },
  iconMuted: {
    fontSize: 13,
    color: colors.textMuted,
    fontFamily: 'Inter_600SemiBold',
  },
  rowText: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  rowTextMuted: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: colors.textMuted,
    lineHeight: 22,
  },
  note: {
    marginTop: 12,
    padding: 16,
    borderRadius: 10,
    backgroundColor: colors.neutral,
    borderWidth: 1,
    borderColor: colors.neutralBorder,
  },
  noteText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 21,
  },
  noteBold: {
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
  },
  button: {
    marginTop: 24,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 17,
    color: colors.white,
  },
});
