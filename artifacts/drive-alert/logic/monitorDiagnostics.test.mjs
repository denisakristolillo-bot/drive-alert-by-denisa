import assert from 'node:assert/strict';
import test from 'node:test';
import { describeMonitorFailure, MONITOR_PIPELINE } from './monitorDiagnostics.ts';

const versions = { expo: '58.0.23', camera: '5.2.3', detector: '2.1.0', nitro: '0.37.2' };

test('diagnostic identifies the new JS pipeline and the bundled dependency versions', () => {
  const text = describeMonitorFailure(new Error('native error'), versions);
  assert.ok(text.startsWith(MONITOR_PIPELINE));
  for (const version of Object.values(versions)) assert.ok(text.includes(version));
  assert.ok(text.includes('JS:'));
  assert.ok(text.includes('native error'));
});

test('diagnostic preserves the original native null pointer and nested cause', () => {
  const cause = new Error('HybridFaceDetectorFactory: java.lang.NullPointerException');
  const error = new Error('FACE_OUTPUT_CREATE', { cause });
  const text = describeMonitorFailure(error, versions);
  assert.ok(text.includes('FACE_OUTPUT_CREATE'));
  assert.ok(text.includes(cause.message));
});

test('diagnostic handles missing messages and circular native causes', () => {
  const error = { message: 'native failure' };
  error.cause = error;
  assert.equal(describeMonitorFailure(error, versions).split('native failure').length, 2);
  assert.ok(describeMonitorFailure(null, versions).includes('senza dettagli'));
  assert.ok(describeMonitorFailure('native failure', versions).includes('native failure'));
});
