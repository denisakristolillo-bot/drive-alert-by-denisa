export type DrowsinessSignal =
  | 'eyesClosed'
  | 'eyesNarrow'
  | 'yawn'
  | 'headDown';

export type Sensitivity = 'balanced' | 'sensitive';

export interface DetectionSample {
  faceVisible: boolean;
  leftEyeOpenProbability: number | null;
  rightEyeOpenProbability: number | null;
  mouthOpenRatio: number | null;
  pitchAngle: number | null;
}

export interface SignalTracker {
  startedAt: Record<DrowsinessSignal, number | null>;
}

export interface DrowsinessEvaluation {
  activeSignals: DrowsinessSignal[];
  pendingSignals: DrowsinessSignal[];
  shouldAlarm: boolean;
}

export interface DetectionThresholds {
  eyesClosedMs: number;
  eyesNarrowMs: number;
  yawnMs: number;
  headDownMs: number;
  eyeClosedProbability: number;
  eyeNarrowProbability: number;
  mouthOpenRatio: number;
  headDownDegrees: number;
}

export const DETECTION_THRESHOLDS: Record<Sensitivity, DetectionThresholds> = {
  balanced: {
    eyesClosedMs: 1800,
    eyesNarrowMs: 2800,
    yawnMs: 2200,
    headDownMs: 1800,
    eyeClosedProbability: 0.2,
    eyeNarrowProbability: 0.42,
    mouthOpenRatio: 0.42,
    headDownDegrees: 18,
  },
  sensitive: {
    eyesClosedMs: 1200,
    eyesNarrowMs: 2000,
    yawnMs: 1700,
    headDownMs: 1400,
    eyeClosedProbability: 0.24,
    eyeNarrowProbability: 0.48,
    mouthOpenRatio: 0.36,
    headDownDegrees: 14,
  },
};

const SIGNALS: DrowsinessSignal[] = [
  'eyesClosed',
  'eyesNarrow',
  'yawn',
  'headDown',
];

export function createSignalTracker(): SignalTracker {
  return {
    startedAt: {
      eyesClosed: null,
      eyesNarrow: null,
      yawn: null,
      headDown: null,
    },
  };
}

export function resetSignalTracker(tracker: SignalTracker): void {
  for (const signal of SIGNALS) {
    tracker.startedAt[signal] = null;
  }
}

export function updateDrowsinessSignals(
  tracker: SignalTracker,
  sample: DetectionSample,
  now: number,
  baselinePitch: number | null,
  thresholds: DetectionThresholds,
): DrowsinessEvaluation {
  if (!sample.faceVisible) {
    resetSignalTracker(tracker);
    return { activeSignals: [], pendingSignals: [], shouldAlarm: false };
  }

  const left = validProbability(sample.leftEyeOpenProbability);
  const right = validProbability(sample.rightEyeOpenProbability);
  const bothEyesAvailable = left !== null && right !== null;
  const averageEyeOpening = bothEyesAvailable ? (left + right) / 2 : null;
  const eyesClosed =
    bothEyesAvailable &&
    left <= thresholds.eyeClosedProbability &&
    right <= thresholds.eyeClosedProbability;

  const rawSignals: Record<DrowsinessSignal, boolean> = {
    eyesClosed,
    eyesNarrow:
      averageEyeOpening !== null &&
      averageEyeOpening <= thresholds.eyeNarrowProbability &&
      !eyesClosed,
    yawn:
      sample.mouthOpenRatio !== null &&
      Number.isFinite(sample.mouthOpenRatio) &&
      sample.mouthOpenRatio >= thresholds.mouthOpenRatio,
    headDown:
      sample.pitchAngle !== null &&
      Number.isFinite(sample.pitchAngle) &&
      (baselinePitch === null
        ? sample.pitchAngle <= -25
        : sample.pitchAngle <= baselinePitch - thresholds.headDownDegrees),
  };

  for (const signal of SIGNALS) {
    if (rawSignals[signal]) {
      tracker.startedAt[signal] ??= now;
    } else {
      tracker.startedAt[signal] = null;
    }
  }

  const requiredDuration: Record<DrowsinessSignal, number> = {
    eyesClosed: thresholds.eyesClosedMs,
    eyesNarrow: thresholds.eyesNarrowMs,
    yawn: thresholds.yawnMs,
    headDown: thresholds.headDownMs,
  };

  const activeSignals = SIGNALS.filter((signal) => {
    const startedAt = tracker.startedAt[signal];
    return startedAt !== null && now - startedAt >= requiredDuration[signal];
  });
  const pendingSignals = SIGNALS.filter(
    (signal) => rawSignals[signal] && !activeSignals.includes(signal),
  );

  return {
    activeSignals,
    pendingSignals,
    shouldAlarm: activeSignals.length > 0,
  };
}

function validProbability(value: number | null): number | null {
  return value !== null && Number.isFinite(value) && value >= 0 && value <= 1
    ? value
    : null;
}
