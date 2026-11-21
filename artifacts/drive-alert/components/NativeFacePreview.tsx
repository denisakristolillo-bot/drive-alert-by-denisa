import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { CameraViewProps } from 'react-native-vision-camera';
import { scheduleOnRN } from 'react-native-worklets';
import { useSharedValue } from 'react-native-reanimated';
import type { Face } from 'react-native-vision-camera-face-detector';
import { FACE_DETECTOR_OPTIONS, copyFaceDetectionResult } from '@/logic/faceDetectorSession';
import type { FaceDetectionResult } from '@/logic/faceDetectorSession';
import { loadCameraModule, loadFaceDetectorFactory } from '@/logic/monitorStartup';

type Props = Omit<CameraViewProps, 'onError' | 'onConfigured' | 'outputs'> & {
  onFacesDetected: (faces: FaceDetectionResult[]) => void;
  onError: (error: Error) => void;
};

type DetectorState = {
  detector: ReturnType<ReturnType<typeof loadFaceDetectorFactory>> | null;
  error: Error | null;
};

export function NativeFacePreview({ onFacesDetected, onError, ...cameraProps }: Props) {
  const { Camera, useFrameOutput } = loadCameraModule();
  const callbacksRef = useRef({ onFacesDetected, onError });
  callbacksRef.current = { onFacesDetected, onError };
  const lastAnalysisAt = useSharedValue(0);

  // This uses the frame detector API instead of the crashing output factory.
  const [detectorState] = useState<DetectorState>(() => {
    try {
      return {
        detector: loadFaceDetectorFactory()(FACE_DETECTOR_OPTIONS),
        error: null,
      };
    } catch (error) {
      return {
        detector: null,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  });

  useEffect(() => {
    if (detectorState.error) onError(detectorState.error);
  }, [detectorState.error, onError]);
  const faceDetector = detectorState.detector;

  const deliverFaces = useCallback((faces: FaceDetectionResult[]) => {
    callbacksRef.current.onFacesDetected(faces);
  }, []);
  const deliverError = useCallback((message: string) => {
    callbacksRef.current.onError(new Error(message));
  }, []);

  const frameOutput = useFrameOutput({
    pixelFormat: 'yuv',
    onFrame(frame) {
      'worklet';
      try {
        const now = Date.now();
        if (now - lastAnalysisAt.value < 100) return;
        lastAnalysisAt.value = now;

        if (!faceDetector) return;

        const nativeFaces: Face[] = faceDetector.detectFaces(frame);
        const faces: FaceDetectionResult[] = [];
        for (let index = 0; index < nativeFaces.length; index++) {
          faces.push(copyFaceDetectionResult(nativeFaces[index]));
        }
        scheduleOnRN(deliverFaces, faces);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        scheduleOnRN(deliverError, message);
      } finally {
        frame.dispose();
      }
    },
  });

  return <Camera {...cameraProps} outputs={[frameOutput]} onError={onError} />;
}
