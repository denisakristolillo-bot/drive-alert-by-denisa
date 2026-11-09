import React from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useLocale } from '@/hooks/useLocale';
import { useAppSettings } from '@/context/AppSettingsContext';
import {
  AppScreen,
  BodyText,
  PageHeading,
  Panel,
} from '@/components/AppUI';
import { DETECTION_THRESHOLDS } from '@/logic/drowsinessRules';

export default function SettingsScreen() {
  const colors = useColors();
  const { locale, t } = useLocale();
  const {
    sensitivity,
    setSensitivity,
    voiceAlerts,
    setVoiceAlerts,
    vibrationAlerts,
    setVibrationAlerts,
    baselinePitch,
    setBaselinePitch,
  } = useAppSettings();
  const sensitivityHint =
    sensitivity === 'balanced'
      ? t.sensitivityBalancedHint
      : t.sensitivityHighHint;

  return (
    <AppScreen>
      <PageHeading
        eyebrow="DRIVE ALERT"
        title={t.settingsTitle}
        subtitle={t.thresholdNote}
      />

      <Panel>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          {t.sensitivity}
        </Text>
        <View style={styles.choiceRow}>
          <SensitivityChoice
            label={t.balanced}
            selected={sensitivity === 'balanced'}
            onPress={() => setSensitivity('balanced')}
          />
          <SensitivityChoice
            label={t.sensitive}
            selected={sensitivity === 'sensitive'}
            onPress={() => setSensitivity('sensitive')}
          />
        </View>
        <BodyText>{sensitivityHint}</BodyText>
        <BodyText>
          {t.thresholdNote} ({Object.values(DETECTION_THRESHOLDS[sensitivity])
            .slice(0, 4)
            .map((value) => `${(value / 1000).toFixed(1)}s`)
            .join(' · ')})
        </BodyText>
      </Panel>

      <Panel>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          {t.voiceAlert}
        </Text>
        <PreferenceToggle
          label={t.voiceAlert}
          value={voiceAlerts}
          onValueChange={setVoiceAlerts}
        />
        <PreferenceToggle
          label={t.vibrationAlert}
          value={vibrationAlerts}
          onValueChange={setVibrationAlerts}
        />
        <BodyText>{t.alertsNote}</BodyText>
      </Panel>

      <Panel>
        <View style={styles.iconTitle}>
          <Ionicons name="language-outline" size={21} color={colors.accent} />
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {t.languageAuto}
          </Text>
        </View>
        <BodyText>{locale.toUpperCase()}</BodyText>
        <BodyText>{t.translatedCatalogs}</BodyText>
      </Panel>

      <Panel>
        <View style={styles.iconTitle}>
          <Ionicons name="body-outline" size={21} color={colors.accent} />
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {t.calibrate}
          </Text>
        </View>
        <BodyText>
          {baselinePitch === null ? t.calibrateHint : t.calibrated}
        </BodyText>
        {baselinePitch !== null ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => setBaselinePitch(null)}
            testID="settings-reset-calibration"
            style={[styles.resetButton, { borderColor: colors.border }]}
          >
            <Text style={[styles.resetText, { color: colors.foreground }]}>
              {t.calibrationReset}
            </Text>
          </Pressable>
        ) : null}
      </Panel>
    </AppScreen>
  );
}

function SensitivityChoice({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      testID={`sensitivity-${label.toLowerCase()}`}
      style={[
        styles.sensitivityChoice,
        {
          backgroundColor: selected ? colors.accent : 'transparent',
          borderColor: selected ? colors.accent : colors.border,
        },
      ]}
    >
      <Text
        style={[
          styles.choiceText,
          {
            color: selected ? colors.primaryForeground : colors.foreground,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function PreferenceToggle({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  const colors = useColors();
  return (
    <View style={styles.toggleRow}>
      <Text style={[styles.toggleLabel, { color: colors.foreground }]}>
        {label}
      </Text>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.muted, true: colors.accent }}
        thumbColor={colors.primaryForeground}
        testID={`toggle-${label.toLowerCase().replaceAll(' ', '-')}`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 16, fontWeight: '700', lineHeight: 22 },
  choiceRow: { flexDirection: 'row', gap: 10 },
  sensitivityChoice: {
    flex: 1,
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  choiceText: { fontSize: 14, fontWeight: '700' },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  toggleLabel: { fontSize: 14, fontWeight: '600' },
  iconTitle: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  resetButton: {
    borderWidth: 1,
    borderRadius: 13,
    alignSelf: 'flex-start',
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  resetText: { fontSize: 13, fontWeight: '600' },
});
