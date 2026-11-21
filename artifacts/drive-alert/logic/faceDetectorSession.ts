import type { Face, FaceDetectorOutputOptions } from 'react-native-vision-camera-face-detector';

// Keep these primitive options explicit across the JS -> Nitro -> Kotlin bridge.
// Classification supplies eye probabilities; contours/landmarks supply mouth geometry.
export const FACE_DETECTOR_OPTIONS = Object.freeze({
  cameraFacing: 'front',
  mirrorMode: 'auto',
  autoMode: false,
  performanceMode: 'fast',
  runLandmarks: true,
  runContours: true,
  runClassifications: true,
  trackingEnabled: false,
  minFaceSize: 0.18,
  outputResolution: 'preview',
} satisfies Omit<FaceDetectorOutputOptions, 'onFacesDetected' | 'onError'>);

export interface FaceDetectorCallbacks {
  onFacesDetected: (faces: Face[]) => void;
  onError: (error: Error) => void;
}

/**
 * One output per mounted monitoring session, not one per face/UI update.
 * Construction is explicit: the caller waits for Camera.onConfigured.
 */
export function createFaceDetectorSession<T extends object>(
  createOutput: (options: FaceDetectorOutputOptions) => T,
  initialCallbacks: FaceDetectorCallbacks,
) {
  let callbacks = initialCallbacks;
  let output: T | undefined;
  let failure: Error | undefined;
  let stopped = false;

  return {
    resume() {
      // React Strict Mode may replay effect cleanup/setup without unmounting
      // Camera. Re-enable delivery without replacing an attached native output.
      stopped = false;
    },
    updateCallbacks(next: FaceDetectorCallbacks) {
      callbacks = next;
    },
    start(): T | undefined {
      if (stopped) return undefined;
      if (failure) throw failure;
      if (output) return output;
      try {
        const created = createOutput({
          ...FACE_DETECTOR_OPTIONS,
          onFacesDetected: faces => {
            if (!stopped) callbacks.onFacesDetected(faces);
          },
          onError: error => {
            if (!stopped) callbacks.onError(error);
          },
        });
        if (!created) {
          throw new Error('La factory nativa ha restituito un output nullo.');
        }
        output = created;
        return output;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        failure = new Error(`FACE_OUTPUT_CREATE: ${message}`, { cause: error });
        throw failure;
      }
    },
    stop() {
      stopped = true;
      // Camera owns the attached output. Do not dispose synchronously here:
      // the Android detector may still be analyzing a frame on its executor.
      // The session and output become collectible after the view detaches.
    },
  };
}
