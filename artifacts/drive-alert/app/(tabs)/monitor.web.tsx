import { Ionicons } from '@expo/vector-icons';
import { Platform, Text } from 'react-native';
import { AppScreen, BodyText, PageHeading, Panel } from '@/components/AppUI';
import { useColors } from '@/hooks/useColors';
import { useLocale } from '@/hooks/useLocale';

export default function MonitorWebScreen() {
  const colors = useColors();
  const { t } = useLocale();
  return (
    <AppScreen>
      <PageHeading eyebrow="DRIVE ALERT" title={t.monitorTitle} subtitle={t.monitorSubtitle} />
      <Panel>
        <Ionicons name="phone-portrait-outline" size={26} color={colors.accent} />
        <Text style={{ color: colors.foreground, fontSize: 17, fontWeight: '700' }}>
          {Platform.OS === 'web' ? t.webUnsupported : t.cameraUnavailable}
        </Text>
        <BodyText>{t.webUnsupportedBody}</BodyText>
      </Panel>
    </AppScreen>
  );
}
