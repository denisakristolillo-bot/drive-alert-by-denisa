import type { Face, FaceDetectorOptions } from 'react-native-vision-camera-face-detector';

// Use the detector object's frame API instead of the CameraOutput factory. This
// avoids the Android createFaceDetectorOutput path that crashes in this app's APK.
// Classification supplies eye probabilities; contours/landmarks supply mouth geometry.
export const FACE_DETECTOR_OPTIONS = Object.freeze({
  cameraFacing: 'front',
  autoMode: false,
  performanceMode: 'fast',
  runLandmarks: true,
  runContours: true,
  runClassifications: true,
  trackingEnabled: false,
  minFaceSize: 0.18,
} satisfies FaceDetectorOptions);

export interface FacePoint {
  x: number;
  y: number;
}

// Only plain data needed by drowsiness classification crosses back to the RN
// runtime; Nitro HybridObject instances themselves are not sent across runtimes.
export interface FaceDetectionResult {
  leftEyeOpenProbability?: number;
  rightEyeOpenProbability?: number;
  pitchAngle: number;
  contours?: {
    UPPER_LIP_BOTTOM?: FacePoint[];
    LOWER_LIP_TOP?: FacePoint[];
  };
  landmarks?: {
    MOUTH_LEFT?: FacePoint;
    MOUTH_RIGHT?: FacePoint;
  };
}

function copyPoints(points: readonly FacePoint[] | undefined): FacePoint[] | undefined {
  'worklet';
  if (!points) return undefined;
  const copied: FacePoint[] = [];
  for (let index = 0; index < points.length; index++) {
    copied.push({ x: points[index].x, y: points[index].y });
  }
  return copied;
}

function copyPoint(point: FacePoint | undefined): FacePoint | undefined {
  'worklet';
  return point ? { x: point.x, y: point.y } : undefined;
}

export function copyFaceDetectionResult(face: Face): FaceDetectionResult {
  'worklet';
  return {
    leftEyeOpenProbability: face.leftEyeOpenProbability,
    rightEyeOpenProbability: face.rightEyeOpenProbability,
    pitchAngle: face.pitchAngle,
    contours: {
      UPPER_LIP_BOTTOM: copyPoints(face.contours?.UPPER_LIP_BOTTOM),
      LOWER_LIP_TOP: copyPoints(face.contours?.LOWER_LIP_TOP),
    },
    landmarks: {
      MOUTH_LEFT: copyPoint(face.landmarks?.MOUTH_LEFT),
      MOUTH_RIGHT: copyPoint(face.landmarks?.MOUTH_RIGHT),
    },
  };
}
