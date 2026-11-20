/** Identifies the JS pipeline, not a claim that native detection passed testing. */
export const MONITOR_PIPELINE = 'DA-FACE-02';

export interface MonitorVersions {
  expo: string;
  camera: string;
  detector: string;
  nitro: string;
}

export function describeMonitorFailure(error: unknown, versions: MonitorVersions): string {
  const messages: string[] = [];
  const visited = new Set<unknown>();
  let current = error;
  // Native errors can wrap another Error, or expose only a message. Preserve
  // their available causes without getting stuck on circular error objects.
  while (current != null && !visited.has(current) && visited.size < 5) {
    visited.add(current);
    const message = typeof current === 'object' && 'message' in current
      ? String(current.message)
      : String(current);
    if (!messages.includes(message)) messages.push(message);
    current = typeof current === 'object' && 'cause' in current ? current.cause : undefined;
  }
  return [
    `${MONITOR_PIPELINE} | JS: Expo ${versions.expo}; Camera ${versions.camera}; Detector ${versions.detector}; Nitro ${versions.nitro}`,
    messages.join('\nCausa: ') || 'Errore nativo senza dettagli.',
  ].join('\n');
}
