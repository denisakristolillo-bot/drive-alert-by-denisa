type CameraModule = typeof import('react-native-vision-camera');
type FaceDetectorModule = typeof import('react-native-vision-camera-face-detector');

// Keep native factory creation inside the route's error boundary, not at import time.
export function loadCameraModule(
  load: () => CameraModule = () => require('react-native-vision-camera'),
): CameraModule {
  const camera = load();
  if (
    typeof camera.useCameraDevice !== 'function' ||
    typeof camera.useCameraPermission !== 'function'
  ) {
    throw new Error('react-native-vision-camera: API fotocamera non disponibile in questa installazione.');
  }
  return camera;
}

// ML Kit/Nitro is initialized only when the user actually starts monitoring.
export function loadFaceCamera(
  load: () => FaceDetectorModule = () =>
    require('react-native-vision-camera-face-detector'),
): FaceDetectorModule['Camera'] {
  const detector = load();
  if (!detector.Camera) {
    throw new Error('react-native-vision-camera-face-detector: componente Camera non disponibile.');
  }
  return detector.Camera;
}

export function loadFaceOutputFactory(
  load: () => FaceDetectorModule = () =>
    require('react-native-vision-camera-face-detector'),
): FaceDetectorModule['createFaceDetectorOutput'] {
  const detector = load();
  if (typeof detector.createFaceDetectorOutput !== 'function') {
    throw new Error('react-native-vision-camera-face-detector: factory output nativa non disponibile.');
  }
  return detector.createFaceDetectorOutput;
}

export async function requestCameraAccess(permission: {
  hasPermission: boolean;
  canRequestPermission: boolean;
  requestPermission: () => Promise<boolean>;
}): Promise<'granted' | 'denied' | 'settings'> {
  if (permission.hasPermission) return 'granted';
  if (!permission.canRequestPermission) return 'settings';
  return (await permission.requestPermission()) ? 'granted' : 'denied';
}
