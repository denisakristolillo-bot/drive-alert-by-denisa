import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { AppScreen, BodyText, PageHeading, Panel, SecondaryButton } from './AppUI';
import type { ErrorFallbackProps } from './ErrorFallback';
import { useColors } from '@/hooks/useColors';
import { useLocale } from '@/hooks/useLocale';
import { describeMonitorFailure } from '@/logic/monitorDiagnostics';

// JSON metadata only: importing this fallback must not initialize native modules.
const bundledVersions = {
  expo: require('expo/package.json').version as string,
  camera: require('react-native-vision-camera/package.json').version as string,
  detector: require('react-native-vision-camera-face-detector/package.json').version as string,
  nitro: require('react-native-nitro-modules/package.json').version as string,
};

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
          MONITOR_INIT: {describeMonitorFailure(error, bundledVersions)}
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
