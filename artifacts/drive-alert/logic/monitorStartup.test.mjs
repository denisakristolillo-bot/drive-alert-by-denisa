import assert from 'node:assert/strict';
import test from 'node:test';
import { loadCameraModule, loadFaceCamera, requestCameraAccess } from './monitorStartup.ts';

test('native camera initialization is deferred until explicitly loaded', () => {
  let loads = 0;
  const camera = { useCameraDevice() {}, useCameraPermission() {} };
  const load = () => { loads++; return camera; };
  assert.equal(loads, 0);
  assert.equal(loadCameraModule(load), camera);
  assert.equal(loads, 1);
});

test('preserves native factory failure details for the route boundary', () => {
  const failure = new Error('NitroModules: CameraFactory is not registered');
  assert.throws(() => loadCameraModule(() => { throw failure; }), error => error === failure);
  assert.throws(() => loadFaceCamera(() => { throw failure; }), error => error === failure);
});

test('rejects incompatible camera exports instead of rendering an undefined component', () => {
  assert.throws(() => loadCameraModule(() => ({})), /react-native-vision-camera/);
  assert.throws(() => loadFaceCamera(() => ({})), /face-detector/);
  const Camera = () => null;
  assert.equal(loadFaceCamera(() => ({ Camera })), Camera);
});

test('already granted permission does not prompt again', async () => {
  assert.equal(await requestCameraAccess({
    hasPermission: true, canRequestPermission: false,
    requestPermission: () => { throw new Error('Unexpected request'); },
  }), 'granted');
});

test('permanently denied permission directs to settings without requesting again', async () => {
  assert.equal(await requestCameraAccess({
    hasPermission: false, canRequestPermission: false,
    requestPermission: () => { throw new Error('Unexpected request'); },
  }), 'settings');
});

test('handles permission granted or denied by Android', async () => {
  for (const granted of [true, false]) {
    assert.equal(await requestCameraAccess({
      hasPermission: false, canRequestPermission: true,
      requestPermission: async () => granted,
    }), granted ? 'granted' : 'denied');
  }
});

test('propagates permission request errors for the screen to report', async () => {
  await assert.rejects(requestCameraAccess({
    hasPermission: false, canRequestPermission: true,
    requestPermission: async () => { throw new Error('Android permission failure'); },
  }), /Android permission failure/);
});
