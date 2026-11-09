import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createSignalTracker,
  DETECTION_THRESHOLDS,
  updateDrowsinessSignals,
} from './drowsinessRules.ts';

const balanced = DETECTION_THRESHOLDS.balanced;

function sample(overrides = {}) {
  return {
    faceVisible: true,
    leftEyeOpenProbability: 0.9,
    rightEyeOpenProbability: 0.9,
    mouthOpenRatio: 0.1,
    pitchAngle: 0,
    ...overrides,
  };
}

test('ignores a brief blink and alarms only after sustained eye closure', () => {
  const tracker = createSignalTracker();
  assert.equal(
    updateDrowsinessSignals(
      tracker,
      sample({ leftEyeOpenProbability: 0.1, rightEyeOpenProbability: 0.1 }),
      1000,
      null,
      balanced,
    ).shouldAlarm,
    false,
  );
  assert.equal(
    updateDrowsinessSignals(
      tracker,
      sample(),
      1250,
      null,
      balanced,
    ).shouldAlarm,
    false,
  );
  assert.equal(
    updateDrowsinessSignals(
      tracker,
      sample({ leftEyeOpenProbability: 0.1, rightEyeOpenProbability: 0.1 }),
      2000,
      null,
      balanced,
    ).shouldAlarm,
    false,
  );
  assert.equal(
    updateDrowsinessSignals(
      tracker,
      sample({ leftEyeOpenProbability: 0.1, rightEyeOpenProbability: 0.1 }),
      3800,
      null,
      balanced,
    ).activeSignals.includes('eyesClosed'),
    true,
  );
});

test('does not alarm for a single yawn-like frame', () => {
  const tracker = createSignalTracker();
  const result = updateDrowsinessSignals(
    tracker,
    sample({ mouthOpenRatio: 0.6 }),
    1000,
    null,
    balanced,
  );
  assert.equal(result.shouldAlarm, false);
  assert.deepEqual(result.pendingSignals, ['yawn']);
});

test('detects a sustained yawn after its configured duration', () => {
  const tracker = createSignalTracker();
  updateDrowsinessSignals(tracker, sample({ mouthOpenRatio: 0.6 }), 1000, null, balanced);
  const result = updateDrowsinessSignals(
    tracker,
    sample({ mouthOpenRatio: 0.6 }),
    3200,
    null,
    balanced,
  );
  assert.equal(result.activeSignals.includes('yawn'), true);
});

test('compares head pitch with the calibrated neutral posture', () => {
  const tracker = createSignalTracker();
  const result = updateDrowsinessSignals(
    tracker,
    sample({ pitchAngle: -20 }),
    1000,
    0,
    balanced,
  );
  assert.deepEqual(result.pendingSignals, ['headDown']);
});

test('resets pending signals when the face leaves the frame', () => {
  const tracker = createSignalTracker();
  updateDrowsinessSignals(
    tracker,
    sample({ leftEyeOpenProbability: 0.1, rightEyeOpenProbability: 0.1 }),
    1000,
    null,
    balanced,
  );
  const result = updateDrowsinessSignals(
    tracker,
    sample({ faceVisible: false }),
    1500,
    null,
    balanced,
  );
  assert.equal(result.shouldAlarm, false);
  assert.deepEqual(result.pendingSignals, []);
  assert.equal(tracker.startedAt.eyesClosed, null);
});
