import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { AppScreen, BodyText, PageHeading, Panel, PrimaryButton } from '@/components/AppUI';
import { useColors } from '@/hooks/useColors';
import { useLocale } from '@/hooks/useLocale';

export default function HomeScreen() {
  const colors = useColors();
  const { t } = useLocale();
  return (
    <AppScreen>
      <PageHeading eyebrow="DRIVE ALERT BY DENISA" title={t.homeTitle} subtitle={t.homeSubtitle} />
      <Panel style={styles.hero}>
        <View style={[styles.iconBadge, { backgroundColor: colors.secondary }]}>
          <Ionicons name="eye-outline" size={28} color={colors.accent} />
        </View>
        <Text style={[styles.status, { color: colors.foreground }]}>{t.homeInactive}</Text>
        <BodyText>{t.homePrivacyBody}</BodyText>
        <PrimaryButton label={t.homeStart} onPress={() => router.push('/monitor')} />
      </Panel>
      <Panel>
        <View style={styles.row}>
          <Ionicons name="shield-checkmark-outline" size={21} color={colors.accent} />
          <Text style={[styles.heading, { color: colors.foreground }]}>{t.homePrivacyTitle}</Text>
        </View>
        <BodyText>{t.privacyBody}</BodyText>
      </Panel>
      <Panel style={{ borderColor: colors.accent }}>
        <Text style={[styles.heading, { color: colors.accent }]}>{t.safetyTitle}</Text>
        <BodyText>{t.safetyNote}</BodyText>
      </Panel>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  hero: { padding: 22, gap: 14 },
  iconBadge: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  status: { fontSize: 20, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  heading: { fontSize: 16, fontWeight: '700' },
});
