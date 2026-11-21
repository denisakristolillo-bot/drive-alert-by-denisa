type CameraModule = typeof import('react-native-vision-camera');
type FaceDetectorModule = typeof import('react-native-vision-camera-face-detector');

// Keep native factory creation inside the route's error boundary, not at import time.
export function loadCameraModule(
  load: () => CameraModule = () => require('react-native-vision-camera'),
): CameraModule {
  const camera = load();
  if (
    typeof camera.useCameraDevice !== 'function' ||
    typeof camera.useCameraPermission !== 'function' ||
    typeof camera.useFrameOutput !== 'function'
  ) {
    throw new Error('react-native-vision-camera: API fotocamera non disponibile in questa installazione.');
  }
  return camera;
}

// ML Kit/Nitro is initialized only when the user actually starts monitoring.
export function loadFaceDetectorFactory(
  load: () => FaceDetectorModule = () =>
    require('react-native-vision-camera-face-detector'),
): FaceDetectorModule['createFaceDetector'] {
  const detector = load();
  if (typeof detector.createFaceDetector !== 'function') {
    throw new Error('react-native-vision-camera-face-detector: factory frame non disponibile.');
  }
  return detector.createFaceDetector;
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
