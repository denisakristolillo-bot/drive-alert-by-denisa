import React, { useCallback, useEffect, useState } from 'react';
import type { CameraOutput, CameraViewProps } from 'react-native-vision-camera';
import type { FaceDetectorCallbacks } from '@/logic/faceDetectorSession';
import { createFaceDetectorSession } from '@/logic/faceDetectorSession';
import { loadCameraModule, loadFaceOutputFactory } from '@/logic/monitorStartup';

type Props = Omit<CameraViewProps, 'onError' | 'onConfigured' | 'outputs'> &
  FaceDetectorCallbacks;

/**
 * Deliberately bypass the detector library's Camera/useFaceDetectorOutput wrapper:
 * in 2.0.6 and 2.1.0 its useMemo depends on fresh rest-options on every render.
 * Preview is configured first; the real ML Kit output is attached exactly once.
 */
export function NativeFacePreview({ onFacesDetected, onError, ...cameraProps }: Props) {
  const { Camera } = loadCameraModule();
  const [outputs, setOutputs] = useState<CameraOutput[]>([]);
  const [startupError, setStartupError] = useState<Error | null>(null);
  const [session] = useState(() => createFaceDetectorSession(
    options => loadFaceOutputFactory()(options),
    { onFacesDetected, onError },
  ));
  session.updateCallbacks({ onFacesDetected, onError });

  useEffect(() => {
    session.resume();
    return () => session.stop();
  }, [session]);

  const handleConfigured = useCallback(() => {
    try {
      const output = session.start();
      if (output) {
        setOutputs(current =>
          current.length === 1 && current[0] === output ? current : [output],
        );
      }
    } catch (error) {
      setStartupError(error instanceof Error ? error : new Error(String(error)));
    }
  }, [session]);

  if (startupError) throw startupError;

  return (
    <Camera
      {...cameraProps}
      outputs={outputs}
      onConfigured={handleConfigured}
      onError={onError}
    />
  );
}
