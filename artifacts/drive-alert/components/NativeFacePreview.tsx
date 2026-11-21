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
