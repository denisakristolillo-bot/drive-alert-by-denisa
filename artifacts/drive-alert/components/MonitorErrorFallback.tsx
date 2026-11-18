import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { AppScreen, BodyText, PageHeading, Panel, SecondaryButton } from './AppUI';
import type { ErrorFallbackProps } from './ErrorFallback';
import { useColors } from '@/hooks/useColors';
import { useLocale } from '@/hooks/useLocale';

// A route-scoped error must not replace all four tabs with the app-wide fallback.
export function MonitorErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const colors = useColors();
  const { t } = useLocale();
  return (
    <AppScreen>
      <PageHeading eyebrow="DRIVE ALERT" title={t.monitorTitle} subtitle={t.cameraError} />
      <Panel>
        <BodyText>{t.homeInactive}</BodyText>
        <Text
          selectable
          testID="monitor-startup-error"
          style={[styles.details, { color: colors.foreground }]}
        >
          MONITOR_INIT: {error.message}
        </Text>
        <SecondaryButton label={t.retry} onPress={resetError} testID="retry-monitor-startup" />
      </Panel>
      <Panel><BodyText>{t.safetyNote}</BodyText></Panel>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  details: { fontSize: 13, lineHeight: 20 },
});
