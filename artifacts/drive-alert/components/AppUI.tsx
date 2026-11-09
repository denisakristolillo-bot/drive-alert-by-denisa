import React from 'react';
import type { ReactNode } from 'react';
import type { TextStyle } from 'react-native';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

export function AppScreen({ children }: { children: ReactNode }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topInset =
    Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[
          styles.screenContent,
          {
            paddingTop: topInset + 12,
            paddingBottom:
              Platform.OS === 'web'
                ? 34
                : Math.max(insets.bottom, 20) + 104,
          },
        ]}
      >
        {children}
      </ScrollView>
    </View>
  );
}

export function Panel({
  children,
  style,
}: {
  children: ReactNode;
  style?: ViewStyle;
}) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.panel,
        { backgroundColor: colors.card, borderColor: colors.border },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function PageHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  const colors = useColors();
  return (
    <View style={styles.heading}>
      {eyebrow ? (
        <Text style={[styles.eyebrow, { color: colors.accent }]}>{eyebrow}</Text>
      ) : null}
      <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  testID,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.primaryButton,
        {
          backgroundColor: disabled
            ? colors.muted
            : pressed
              ? colors.accent
              : colors.primary,
          opacity: disabled ? 0.65 : 1,
        },
      ]}
    >
      <Text
        style={[
          styles.primaryButtonText,
          { color: colors.primaryForeground },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function SecondaryButton({
  label,
  onPress,
  disabled = false,
  testID,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.secondaryButton,
        {
          borderColor: colors.border,
          backgroundColor: pressed ? colors.secondary : 'transparent',
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      <Text style={[styles.secondaryButtonText, { color: colors.foreground }]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function BodyText({
  children,
  style,
}: {
  children: ReactNode;
  style?: TextStyle;
}) {
  const colors = useColors();
  return (
    <Text style={[styles.body, { color: colors.mutedForeground }, style]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  screenContent: {
    paddingHorizontal: 20,
    gap: 18,
    flexGrow: 1,
  },
  panel: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
    gap: 12,
  },
  heading: { gap: 8, marginBottom: 2 },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.6,
  },
  title: {
    fontSize: 31,
    lineHeight: 38,
    fontWeight: '700',
    letterSpacing: -0.6,
  },
  subtitle: { fontSize: 15, lineHeight: 22 },
  primaryButton: {
    minHeight: 54,
    borderRadius: 16,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { fontSize: 15, fontWeight: '700' },
  secondaryButton: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: { fontSize: 14, fontWeight: '600' },
  body: { fontSize: 14, lineHeight: 21 },
});
