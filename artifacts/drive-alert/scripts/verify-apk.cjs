// Read-only preflight: no EAS calls, builds, credential access or publishing.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');

const root = path.resolve(__dirname, '..');
const workspace = path.resolve(root, '../..');
const appRequire = createRequire(path.join(root, 'package.json'));
const read = (name) => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
const { expo } = read('app.json');
const eas = read('eas.json');
const pkg = read('package.json');
const workspacePkg = JSON.parse(fs.readFileSync(path.join(workspace, 'package.json'), 'utf8'));

assert.equal(expo.owner, 'denisakristolillos-team');
assert.equal(expo.slug, 'deni');
assert.equal(expo.extra.eas.projectId, '09e8908b-367f-46dd-a762-3d5f99b09200');
assert.equal(expo.android.package, 'com.denisa.drivealert');
assert.ok(Number.isInteger(expo.android.versionCode) && expo.android.versionCode >= 2,
  'The corrected Android candidate must be distinguishable from versionCode 1.');
for (const file of ['app.json', 'eas.json']) {
  assert.equal(fs.existsSync(path.join(workspace, file)), false, `Duplicate root ${file}`);
}
const preview = eas.build.preview;
assert.equal(preview.distribution, 'internal');
assert.equal(preview.developmentClient, false);
assert.equal(preview.android.buildType, 'apk');
assert.equal(preview.credentialsSource, 'remote');
assert.equal(Object.keys(eas.submit || {}).length, 0);
assert.equal(workspacePkg.packageManager, `pnpm@${preview.pnpm}`);
assert.ok(pkg.devDependencies['babel-preset-expo'] || pkg.dependencies['babel-preset-expo']);

// Exercise the actual Babel config with Android/Metro caller metadata.
const babel = appRequire('@babel/core');
const transformed = babel.transformSync(
  'export const Probe = ({label}: {label: string}) => <Text>{label}</Text>;',
  {
    cwd: root,
    filename: path.join(root, 'apk-preflight-probe.tsx'),
    configFile: path.join(root, 'babel.config.js'),
    babelrc: false,
    caller: {
      name: 'metro', platform: 'android', isDev: false,
      supportsStaticESM: true, supportsDynamicImport: true, supportsExportNamespaceFrom: true,
    },
  },
);
assert.ok(transformed.code);
for (const name of [
  'babel-preset-expo', 'react-native-worklets/plugin', 'expo-router/entry',
  '@react-native/metro-config',
  'expo-dev-client', 'react-native-vision-camera', 'react-native-vision-camera-face-detector',
  'react-native-nitro-modules', 'react-native-nitro-image',
]) {
  appRequire.resolve(name);
  console.log(`OK module: ${name}`);
}
console.log('OK Expo Deni identity; no duplicate root configs; internal preview APK; Babel Android TSX transform.');
console.log('Native compilation, remote signing availability and real-device behavior are NOT verified by this check.');
