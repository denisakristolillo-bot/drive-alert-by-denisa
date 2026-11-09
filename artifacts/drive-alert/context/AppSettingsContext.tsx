import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import type { Sensitivity } from '@/logic/drowsinessRules';

const STORAGE_KEY = '@drive-alert/settings-v1';

export interface AppSettings {
  sensitivity: Sensitivity;
  voiceAlerts: boolean;
  vibrationAlerts: boolean;
  baselinePitch: number | null;
}

interface AppSettingsContextValue extends AppSettings {
  setSensitivity: (value: Sensitivity) => void;
  setVoiceAlerts: (value: boolean) => void;
  setVibrationAlerts: (value: boolean) => void;
  setBaselinePitch: (value: number | null) => void;
}

const DEFAULT_SETTINGS: AppSettings = {
  sensitivity: 'balanced',
  voiceAlerts: true,
  vibrationAlerts: true,
  baselinePitch: null,
};

const AppSettingsContext = createContext<AppSettingsContextValue | null>(null);

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (!mounted) return;
        if (stored) {
          const parsed: unknown = JSON.parse(stored);
          if (isAppSettings(parsed)) setSettings(parsed);
        }
      })
      .catch(() => {
        // Defaults remain usable if local preferences cannot be read.
      })
      .finally(() => {
        if (mounted) setHydrated(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings)).catch(() => {
      // Preferences still work for this session if storage is unavailable.
    });
  }, [hydrated, settings]);

  const setSensitivity = useCallback((value: Sensitivity) => {
    setSettings((current) => ({ ...current, sensitivity: value }));
  }, []);
  const setVoiceAlerts = useCallback((value: boolean) => {
    setSettings((current) => ({ ...current, voiceAlerts: value }));
  }, []);
  const setVibrationAlerts = useCallback((value: boolean) => {
    setSettings((current) => ({ ...current, vibrationAlerts: value }));
  }, []);
  const setBaselinePitch = useCallback((value: number | null) => {
    setSettings((current) => ({ ...current, baselinePitch: value }));
  }, []);

  const value = useMemo<AppSettingsContextValue>(
    () => ({
      ...settings,
      setSensitivity,
      setVoiceAlerts,
      setVibrationAlerts,
      setBaselinePitch,
    }),
    [
      settings,
      setSensitivity,
      setVoiceAlerts,
      setVibrationAlerts,
      setBaselinePitch,
    ],
  );

  return (
    <AppSettingsContext.Provider value={value}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings(): AppSettingsContextValue {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error('useAppSettings must be used within AppSettingsProvider.');
  }
  return context;
}

function isAppSettings(value: unknown): value is AppSettings {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<AppSettings>;
  return (
    (candidate.sensitivity === 'balanced' ||
      candidate.sensitivity === 'sensitive') &&
    typeof candidate.voiceAlerts === 'boolean' &&
    typeof candidate.vibrationAlerts === 'boolean' &&
    (candidate.baselinePitch === null ||
      (typeof candidate.baselinePitch === 'number' &&
        Number.isFinite(candidate.baselinePitch)))
  );
}
