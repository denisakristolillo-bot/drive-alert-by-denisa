import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useColors } from '@/hooks/useColors';
import { useLocale } from '@/hooks/useLocale';

export default function TabLayout() {
  const colors = useColors();
  const { t } = useLocale();
  const isIOS = Platform.OS === 'ios';
  const isWeb = Platform.OS === 'web';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: isIOS ? 'transparent' : colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={85} tint="dark" style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />
          ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.tabHome,
          tabBarIcon: ({ focused }) => <Feather name="navigation" size={21} color={focused ? colors.accent : colors.mutedForeground} />,
        }}
      />
      <Tabs.Screen
        name="monitor"
        options={{
          title: t.tabMonitor,
          tabBarIcon: ({ focused }) => <Feather name="eye" size={21} color={focused ? colors.accent : colors.mutedForeground} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t.tabSettings,
          tabBarIcon: ({ focused }) => <Feather name="settings" size={21} color={focused ? colors.accent : colors.mutedForeground} />,
        }}
      />
    </Tabs>
  );
}
