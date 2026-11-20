import assert from 'node:assert/strict';
import test from 'node:test';
import { createFaceDetectorSession, FACE_DETECTOR_OPTIONS } from './faceDetectorSession.ts';
import { loadFaceOutputFactory } from './monitorStartup.ts';

const callbacks = () => ({ onFacesDetected() {}, onError() {} });

test('does not construct a native detector before camera configuration', () => {
  let calls = 0;
  const output = {};
  const session = createFaceDetectorSession(() => { calls++; return output; }, callbacks());
  assert.equal(calls, 0);
  assert.equal(session.start(), output);
  assert.equal(calls, 1);
});

test('UI updates and repeated configured events reuse one native output', () => {
  let calls = 0;
  const output = {};
  const session = createFaceDetectorSession(() => { calls++; return output; }, callbacks());
  session.start();
  for (let n = 0; n < 100; n++) {
    session.updateCallbacks(callbacks());
    assert.equal(session.start(), output);
  }
  assert.equal(calls, 1);
});

test('stable native callbacks forward only to the latest active handlers', () => {
  let nativeOptions;
  let facesSeen = 0;
  let errorsSeen = 0;
  const session = createFaceDetectorSession(options => {
    nativeOptions = options;
    return {};
  }, { onFacesDetected() { throw Error('stale callback'); }, onError() { throw Error('stale callback'); } });
  session.start();
  session.updateCallbacks({
    onFacesDetected: () => { facesSeen++; },
    onError: () => { errorsSeen++; },
  });
  nativeOptions.onFacesDetected([]);
  nativeOptions.onError(new Error('native failure'));
  assert.equal(facesSeen, 1);
  assert.equal(errorsSeen, 1);
  session.stop();
  nativeOptions.onFacesDetected([]);
  nativeOptions.onError(new Error('late failure'));
  assert.equal(facesSeen, 1);
  assert.equal(errorsSeen, 1);
  assert.equal(session.start(), undefined);
});

test('all detector options are explicit and real eye/mouth data stays enabled', () => {
  let options;
  createFaceDetectorSession(value => { options = value; return {}; }, callbacks()).start();
  for (const key of Object.keys(FACE_DETECTOR_OPTIONS)) {
    assert.notEqual(options[key], undefined, key);
    assert.notEqual(options[key], null, key);
  }
  assert.equal(options.runClassifications, true);
  assert.equal(options.runContours, true);
  assert.equal(options.runLandmarks, true);
  assert.equal(options.cameraFacing, 'front');
  assert.equal(options.mirrorMode, 'auto');
  assert.equal(options.autoMode, false);
  assert.equal('windowWidth' in options, false);
  assert.equal('windowHeight' in options, false);
});

test('preserves native null-pointer cause and does not silently retry', () => {
  let calls = 0;
  const cause = new Error('HybridFaceDetectorFactory: java.lang.NullPointerException');
  const session = createFaceDetectorSession(() => { calls++; throw cause; }, callbacks());
  for (let n = 0; n < 2; n++) {
    assert.throws(() => session.start(), error =>
      error.message.includes('FACE_OUTPUT_CREATE') && error.cause === cause,
    );
  }
  assert.equal(calls, 1);
});

test('rejects missing exports and null native outputs explicitly', () => {
  assert.throws(() => loadFaceOutputFactory(() => ({})), /factory output nativa/);
  const factory = () => ({});
  assert.equal(loadFaceOutputFactory(() => ({ createFaceDetectorOutput: factory })), factory);
  assert.throws(() => createFaceDetectorSession(() => null, callbacks()).start(), /output nullo/);
});

test('a user-started new session creates a new output after the old session stops', () => {
  let calls = 0;
  const factory = () => { calls++; return {}; };
  const first = createFaceDetectorSession(factory, callbacks());
  first.start();
  first.stop();
  const next = createFaceDetectorSession(factory, callbacks());
  next.start();
  assert.equal(calls, 2);
});

test('Strict Mode effect replay does not replace an attached output or silence callbacks', () => {
  let calls = 0;
  let options;
  let received = 0;
  const output = {};
  const session = createFaceDetectorSession(value => {
    calls++;
    options = value;
    return output;
  }, { onFacesDetected: () => { received++; }, onError() {} });
  session.resume();
  session.start();
  session.stop();
  session.resume();
  assert.equal(session.start(), output);
  options.onFacesDetected([]);
  assert.equal(received, 1);
  assert.equal(calls, 1);
});
