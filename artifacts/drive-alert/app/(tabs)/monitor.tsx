import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AppState,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { AppStateStatus } from 'react-native';
import { useFocusEffect, useIsFocused } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useLocale } from '@/hooks/useLocale';
import { useAppSettings } from '@/context/AppSettingsContext';
import {
  AppScreen,
  BodyText,
  PageHeading,
  Panel,
  PrimaryButton,
  SecondaryButton,
} from '@/components/AppUI';
import {
  Camera as FaceCamera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';
import type { Face } from 'react-native-vision-camera-face-detector';
import { useFaceDetectorOutput } from 'react-native-vision-camera-face-detector';
import {
  createSignalTracker,
  DETECTION_THRESHOLDS,
  resetSignalTracker,
  updateDrowsinessSignals,
} from '@/logic/drowsinessRules';
import type {
  DetectionSample,
  DrowsinessSignal,
  SignalTracker,
} from '@/logic/drowsinessRules';

export default function MonitorScreen() {
  const colors = useColors();
  const { t, locale } = useLocale();
  const {
    sensitivity,
    voiceAlerts,
    vibrationAlerts,
    baselinePitch,
    setBaselinePitch,
  } = useAppSettings();
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('front');
  const isFocused = useIsFocused();
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const [running, setRunning] = useState(false);
  const [faceVisible, setFaceVisible] = useState(false);
  const [eyeMetricsAvailable, setEyeMetricsAvailable] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [alarmActive, setAlarmActive] = useState(false);
  const [activeSignals, setActiveSignals] = useState<DrowsinessSignal[]>([]);
  const [feedback, setFeedback] = useState('');
  const [latestFrameAt, setLatestFrameAt] = useState<number | null>(null);
  const trackerRef = useRef<SignalTracker>(createSignalTracker());
  const settingsRef = useRef({ voiceAlerts, vibrationAlerts, baselinePitch });
  const lastFaceRef = useRef<Face | null>(null);
  const lastUiUpdateRef = useRef(0);
  const lastFrameAtRef = useRef<number | null>(null);
  const alarmConditionRef = useRef(false);
  const dismissedUntilClearRef = useRef(false);

  settingsRef.current = { voiceAlerts, vibrationAlerts, baselinePitch };

  const thresholds = DETECTION_THRESHOLDS[sensitivity];
  const shouldRun =
    running &&
    isFocused &&
    appState === 'active' &&
    hasPermission &&
    !!device &&
    Platform.OS !== 'web';

  const faceOutput = useFaceDetectorOutput({
    performanceMode: 'fast',
    runLandmarks: true,
    runContours: true,
    runClassifications: true,
    minFaceSize: 0.18,
    trackingEnabled: false,
    outputResolution: 'preview',
    cameraFacing: 'front',
    onFacesDetected: (faces) => handleFacesDetected(faces),
    onError: (error) => {
      setCameraError(error.message || t.cameraError);
      setRunning(false);
      setAlarmActive(false);
      Speech.stop();
    },
  });

  function handleFacesDetected(faces: Face[]) {
    const now = Date.now();
    lastFrameAtRef.current = now;
    if (now - lastUiUpdateRef.current > 320) {
      lastUiUpdateRef.current = now;
      setLatestFrameAt(now);
    }

    const face = faces[0];
    if (!face) {
      lastFaceRef.current = null;
      setFaceVisible(false);
      setEyeMetricsAvailable(false);
      setActiveSignals([]);
      alarmConditionRef.current = false;
      dismissedUntilClearRef.current = false;
      resetSignalTracker(trackerRef.current);
      if (alarmActive) {
        setAlarmActive(false);
        Speech.stop();
      }
      return;
    }

    lastFaceRef.current = face;
    const sample = toDetectionSample(face);
    const evaluation = updateDrowsinessSignals(
      trackerRef.current,
      sample,
      now,
      settingsRef.current.baselinePitch,
      thresholds,
    );

    setFaceVisible(true);
    setEyeMetricsAvailable(
      sample.leftEyeOpenProbability !== null &&
        sample.rightEyeOpenProbability !== null,
    );
    if (now - lastUiUpdateRef.current < 650) {
      setActiveSignals(evaluation.activeSignals);
    }

    if (!evaluation.shouldAlarm) {
      alarmConditionRef.current = false;
      dismissedUntilClearRef.current = false;
      if (alarmActive) {
        setAlarmActive(false);
        Speech.stop();
      }
      return;
    }

    if (!alarmConditionRef.current) {
      alarmConditionRef.current = true;
      if (!dismissedUntilClearRef.current) {
        setAlarmActive(true);
        if (settingsRef.current.voiceAlerts) {
          Speech.speak(t.alarmTitle, { language: locale, rate: 0.95 });
        }
        if (settingsRef.current.vibrationAlerts) {
          Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Warning,
          ).catch(() => undefined);
        }
      }
    }
  }

  const faceCameraProps = useMemo(
    () => faceOutput,
    [faceOutput],
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      setAppState(nextState);
      if (nextState !== 'active') {
        setRunning(false);
        setAlarmActive(false);
        setFaceVisible(false);
        setActiveSignals([]);
        Speech.stop();
        resetSignalTracker(trackerRef.current);
      }
    });
    return () => subscription.remove();
  }, []);

  useFocusEffect(
    useCallback(
      () => () => {
        setRunning(false);
        setAlarmActive(false);
        Speech.stop();
      },
      [],
    ),
  );

  useEffect(() => {
    if (!shouldRun) return;
    lastFrameAtRef.current = Date.now();
    const timer = setInterval(() => {
      const lastFrame = lastFrameAtRef.current;
      if (lastFrame !== null && Date.now() - lastFrame > 4000) {
        setCameraError(t.cameraError);
        setRunning(false);
        setAlarmActive(false);
        setFaceVisible(false);
        Speech.stop();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [shouldRun, t.cameraError]);

  const startMonitoring = useCallback(async () => {
    setCameraError('');
    setFeedback('');
    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) {
        setCameraError(t.permissionTitle);
        return;
      }
    }
    if (!device) {
      setCameraError(t.cameraUnavailable);
      return;
    }
    resetSignalTracker(trackerRef.current);
    dismissedUntilClearRef.current = false;
    alarmConditionRef.current = false;
    lastFrameAtRef.current = Date.now();
    setFaceVisible(false);
    setActiveSignals([]);
    setRunning(true);
  }, [device, hasPermission, requestPermission, t.cameraUnavailable, t.permissionTitle]);

  const pauseMonitoring = useCallback(() => {
    setRunning(false);
    setAlarmActive(false);
    setFaceVisible(false);
    setActiveSignals([]);
    lastFaceRef.current = null;
    alarmConditionRef.current = false;
    dismissedUntilClearRef.current = false;
    resetSignalTracker(trackerRef.current);
    Speech.stop();
  }, []);

  const stopAlarm = useCallback(() => {
    dismissedUntilClearRef.current = true;
    setAlarmActive(false);
    Speech.stop();
  }, []);

  const calibratePosture = useCallback(() => {
    const face = lastFaceRef.current;
    const left = face?.leftEyeOpenProbability;
    const right = face?.rightEyeOpenProbability;
    if (
      !face ||
      left === undefined ||
      right === undefined ||
      left < 0.6 ||
      right < 0.6 ||
      !Number.isFinite(face.pitchAngle)
    ) {
      setFeedback(t.calibrationNeedFace);
      return;
    }
    setBaselinePitch(face.pitchAngle);
    setFeedback(t.calibrated);
  }, [setBaselinePitch, t.calibrated, t.calibrationNeedFace]);

  const removeCalibration = useCallback(() => {
    setBaselinePitch(null);
    setFeedback('');
  }, [setBaselinePitch]);

  const permissionAction = useCallback(async () => {
    const granted = await requestPermission();
    if (!granted) setCameraError(t.permissionTitle);
    else setCameraError('');
  }, [requestPermission, t.permissionTitle]);

  const signalLabel: Record<DrowsinessSignal, string> = {
    eyesClosed: t.signalEyesClosed,
    eyesNarrow: t.signalEyesNarrow,
    yawn: t.signalYawn,
    headDown: t.signalHeadDown,
  };

  return (
    <AppScreen>
      <PageHeading
        eyebrow="DRIVE ALERT"
        title={t.monitorTitle}
        subtitle={t.monitorSubtitle}
      />

      {Platform.OS === 'web' ? (
        <Panel style={styles.noticePanel}>
          <Ionicons name="phone-portrait-outline" size={25} color={colors.accent} />
          <Text style={[styles.panelTitle, { color: colors.foreground }]}>
            {t.webUnsupported}
          </Text>
          <BodyText>{t.webUnsupportedBody}</BodyText>
        </Panel>
      ) : !hasPermission ? (
        <Panel style={styles.noticePanel}>
          <Ionicons name="camera-outline" size={25} color={colors.accent} />
          <Text style={[styles.panelTitle, { color: colors.foreground }]}>
            {t.permissionTitle}
          </Text>
          <BodyText>{t.permissionBody}</BodyText>
          <PrimaryButton
            label={t.requestPermission}
            onPress={permissionAction}
            testID="request-camera-permission"
          />
          <SecondaryButton
            label={t.openSettings}
            onPress={() => Linking.openSettings().catch(() => undefined)}
            testID="open-camera-settings"
          />
        </Panel>
      ) : !device ? (
        <Panel style={styles.noticePanel}>
          <Ionicons name="alert-circle-outline" size={25} color={colors.destructive} />
          <Text style={[styles.panelTitle, { color: colors.foreground }]}>
            {t.cameraUnavailable}
          </Text>
          <BodyText>{t.waitingBody}</BodyText>
        </Panel>
      ) : null}

      {Platform.OS !== 'web' && hasPermission && device ? (
        <>
          <Panel style={styles.cameraPanel}>
            <View style={styles.cameraTopline}>
              <View
                style={[
                  styles.liveDot,
                  { backgroundColor: shouldRun ? colors.accent : colors.mutedForeground },
                ]}
              />
              <Text style={[styles.liveLabel, { color: colors.foreground }]}>
                {shouldRun ? t.ready : t.paused}
              </Text>
            </View>
            <View
              style={[
                styles.cameraFrame,
                { backgroundColor: colors.secondary, borderColor: colors.border },
              ]}
            >
              {shouldRun ? (
                <FaceCamera
                  {...faceCameraProps}
                  device={device}
                  isActive={shouldRun}
                  cameraFacing="front"
                  runClassifications
                  runContours
                  runLandmarks
                  performanceMode="fast"
                  minFaceSize={0.18}
                  outputResolution="preview"
                  onFacesDetected={handleFacesDetected}
                  onError={(error) => {
                    setCameraError(error.message || t.cameraError);
                    setRunning(false);
                    setAlarmActive(false);
                    Speech.stop();
                  }}
                  style={StyleSheet.absoluteFill}
                />
              ) : (
                <View style={styles.cameraOff}>
                  <Ionicons name="scan-outline" size={34} color={colors.accent} />
                  <Text style={[styles.cameraOffTitle, { color: colors.foreground }]}>
                    {t.waiting}
                  </Text>
                  <Text
                    style={[
                      styles.cameraOffBody,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    {t.waitingBody}
                  </Text>
                </View>
              )}
              {shouldRun && faceVisible ? (
                <View
                  style={[
                    styles.faceBadge,
                    { backgroundColor: colors.background, borderColor: colors.accent },
                  ]}
                >
                  <Text style={[styles.faceBadgeText, { color: colors.accent }]}>
                    {t.faceDetected}
                  </Text>
                </View>
              ) : null}
            </View>
            {shouldRun && !faceVisible ? (
              <Text style={[styles.warningCopy, { color: colors.destructive }]}>
                {t.waitingBody}
              </Text>
            ) : null}
            {shouldRun && faceVisible && !eyeMetricsAvailable ? (
              <Text style={[styles.warningCopy, { color: colors.destructive }]}>
                {t.eyesUnavailable}
              </Text>
            ) : null}
          </Panel>

          {cameraError ? (
            <Panel style={styles.errorPanel}>
              <Text style={[styles.panelTitle, { color: colors.destructive }]}>
                {cameraError}
              </Text>
              <PrimaryButton
                label={t.retry}
                onPress={startMonitoring}
                testID="retry-monitoring"
              />
            </Panel>
          ) : null}

          {alarmActive ? (
            <Panel style={[styles.alarmPanel, { borderColor: colors.destructive }]}>
              <Ionicons name="warning-outline" size={26} color={colors.destructive} />
              <Text style={[styles.panelTitle, { color: colors.destructive }]}>
                {t.alarmTitle}
              </Text>
              {activeSignals.map((signal) => (
                <Text
                  key={signal}
                  style={[styles.signalText, { color: colors.foreground }]}
                >
                  {signalLabel[signal]}
                </Text>
              ))}
              <SecondaryButton
                label={t.stopAlarm}
                onPress={stopAlarm}
                testID="stop-drowsiness-alarm"
              />
            </Panel>
          ) : null}

          <View style={styles.actions}>
            {shouldRun ? (
              <SecondaryButton
                label={t.pauseMonitor}
                onPress={pauseMonitoring}
                testID="pause-monitoring"
              />
            ) : (
              <PrimaryButton
                label={t.startMonitor}
                onPress={startMonitoring}
                testID="start-monitoring"
              />
            )}
          </View>

          {shouldRun ? (
            <Panel>
              <View style={styles.sectionTitleRow}>
                <Text style={[styles.panelTitle, { color: colors.foreground }]}>
                  {t.calibrate}
                </Text>
                {baselinePitch === null ? (
                  <Text style={[styles.smallBadge, { color: colors.accent }]}>
                    —
                  </Text>
                ) : (
                  <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
                )}
              </View>
              <BodyText>{t.calibrateHint}</BodyText>
              <SecondaryButton
                label={t.calibrate}
                onPress={calibratePosture}
                testID="calibrate-posture"
              />
              {baselinePitch !== null ? (
                <SecondaryButton
                  label={t.calibrationReset}
                  onPress={removeCalibration}
                  testID="remove-calibration"
                />
              ) : null}
              {feedback ? (
                <Text style={[styles.feedback, { color: colors.accent }]}>
                  {feedback}
                </Text>
              ) : null}
            </Panel>
          ) : null}
        </>
      ) : null}

      <Panel style={styles.signalsPanel}>
        <Text style={[styles.panelTitle, { color: colors.foreground }]}>
          {t.sensitivity}: {sensitivity === 'balanced' ? t.balanced : t.sensitive}
        </Text>
        <View style={styles.signalRow}>
          <SignalIndicator
            label={t.signalEyesClosed}
            active={activeSignals.includes('eyesClosed')}
          />
          <SignalIndicator
            label={t.signalEyesNarrow}
            active={activeSignals.includes('eyesNarrow')}
          />
          <SignalIndicator
            label={t.signalYawn}
            active={activeSignals.includes('yawn')}
          />
          <SignalIndicator
            label={t.signalHeadDown}
            active={activeSignals.includes('headDown')}
          />
        </View>
      </Panel>

      <Panel>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="lock-closed-outline" size={20} color={colors.accent} />
          <Text style={[styles.panelTitle, { color: colors.foreground }]}>
            {t.privacyTitle}
          </Text>
        </View>
        <BodyText>{t.privacyBody}</BodyText>
      </Panel>

      <Panel style={styles.safetyPanel}>
        <Text style={[styles.panelTitle, { color: colors.accent }]}>
          {t.safetyTitle}
        </Text>
        <BodyText>{t.safetyNote}</BodyText>
      </Panel>
    </AppScreen>
  );
}

function SignalIndicator({ label, active }: { label: string; active: boolean }) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.signalIndicator,
        {
          borderColor: active ? colors.destructive : colors.border,
          backgroundColor: active ? `${colors.destructive}1C` : 'transparent',
        },
      ]}
    >
      <Text
        style={[
          styles.signalIndicatorText,
          { color: active ? colors.destructive : colors.mutedForeground },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

function toDetectionSample(face: Face): DetectionSample {
  return {
    faceVisible: true,
    leftEyeOpenProbability: validProbability(face.leftEyeOpenProbability),
    rightEyeOpenProbability: validProbability(face.rightEyeOpenProbability),
    mouthOpenRatio: getMouthOpenRatio(face),
    pitchAngle: Number.isFinite(face.pitchAngle) ? face.pitchAngle : null,
  };
}

function validProbability(value: number | undefined): number | null {
  return value !== undefined &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 1
    ? value
    : null;
}

function getMouthOpenRatio(face: Face): number | null {
  const upperLip = face.contours?.UPPER_LIP_BOTTOM;
  const lowerLip = face.contours?.LOWER_LIP_TOP;
  const mouthLeft = face.landmarks?.MOUTH_LEFT;
  const mouthRight = face.landmarks?.MOUTH_RIGHT;
  if (!upperLip?.length || !lowerLip?.length || !mouthLeft || !mouthRight) {
    return null;
  }
  const upperY = average(upperLip.map((point) => point.y));
  const lowerY = average(lowerLip.map((point) => point.y));
  const mouthWidth = Math.abs(mouthRight.x - mouthLeft.x);
  if (!Number.isFinite(upperY) || !Number.isFinite(lowerY) || mouthWidth <= 0) {
    return null;
  }
  return Math.abs(lowerY - upperY) / mouthWidth;
}

function average(values: number[]): number {
  return values.reduce((total, value) => total + value, 0) / values.length;
}

const styles = StyleSheet.create({
  noticePanel: { alignItems: 'flex-start' },
  panelTitle: { fontSize: 16, lineHeight: 22, fontWeight: '700' },
  cameraPanel: { padding: 12 },
  cameraTopline: {
    minHeight: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 4,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  liveLabel: { fontSize: 13, fontWeight: '700' },
  cameraFrame: {
    width: '100%',
    height: 280,
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: 16,
    justifyContent: 'center',
  },
  cameraOff: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    gap: 10,
  },
  cameraOffTitle: { fontSize: 17, fontWeight: '700', textAlign: 'center' },
  cameraOffBody: { fontSize: 13, lineHeight: 19, textAlign: 'center' },
  faceBadge: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 10,
    borderWidth: 1,
    borderRadius: 12,
    padding: 9,
  },
  faceBadgeText: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  warningCopy: { fontSize: 13, lineHeight: 19, paddingHorizontal: 2 },
  actions: { gap: 10 },
  alarmPanel: { borderWidth: 1, backgroundColor: '#3A1B21' },
  signalText: { fontSize: 14, fontWeight: '600' },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 9,
  },
  smallBadge: { fontSize: 16, fontWeight: '700' },
  feedback: { fontSize: 13, fontWeight: '600' },
  signalsPanel: { gap: 14 },
  signalRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  signalIndicator: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 7,
    paddingHorizontal: 9,
  },
  signalIndicatorText: { fontSize: 11, fontWeight: '600' },
  safetyPanel: { marginBottom: 8 },
});
