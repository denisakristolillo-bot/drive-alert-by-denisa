import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import test from 'node:test';

const require = createRequire(new URL('../package.json', import.meta.url));
const app = require('./package.json');
const pkg = name => require(`${name}/package.json`);
const nativeFile = (name, path) =>
  readFileSync(join(dirname(require.resolve(`${name}/package.json`)), path), 'utf8');

// These are source/dependency regression checks, not Android runtime tests.
test('camera and detector are pinned to the selected stable native stack', () => {
  for (const [name, version] of [
    ['react-native-vision-camera', '5.2.3'],
    ['react-native-vision-camera-face-detector', '2.1.0'],
  ]) {
    assert.equal(app.dependencies[name], version);
    assert.equal(pkg(name).version, version);
  }
});

test('both native generators and installed Nitro use the 0.37 series', () => {
  assert.match(pkg('react-native-nitro-modules').version, /^0\.37\./);
  for (const name of ['react-native-vision-camera', 'react-native-vision-camera-face-detector']) {
    assert.match(pkg(name).devDependencies.nitrogen, /^\^?0\.37\./);
  }
});

test('React Native and Worklets match the installed Expo SDK 58 requirements', () => {
  assert.match(pkg('expo').version, /^58\./);
  const bundled = require('expo/bundledNativeModules.json');
  assert.equal(pkg('react-native').version, bundled['react-native']);
  assert.equal(pkg('react-native-worklets').version, bundled['react-native-worklets']);
});

test('Android detector no longer initializes the old global orientation listener', () => {
  const source = nativeFile(
    'react-native-vision-camera-face-detector',
    'android/src/main/java/com/margelo/nitro/camera/facedetector/HybridFaceDetectorOutput.kt',
  );
  assert.doesNotMatch(source, /FaceDetectorOrientation|NitroModules\.applicationContext/);
  assert.match(source, /FaceDetection\.getClient/);
  assert.match(source, /ImageAnalysis\.OUTPUT_IMAGE_FORMAT_YUV_420_888/);
});

test('Android keeps bundled ML Kit and guards the AGP built-in Kotlin extension', () => {
  const gradle = nativeFile('react-native-vision-camera-face-detector', 'android/build.gradle');
  assert.match(gradle, /com\.google\.mlkit:face-detection:16\.1\.7/);
  assert.match(gradle, /findByName\('kotlin'\) == null/);
  const config = require('./app.json').expo;
  assert.equal(config.android.package, 'com.denisa.drivealert');
  assert.ok(config.android.permissions.includes('android.permission.CAMERA'));
});
