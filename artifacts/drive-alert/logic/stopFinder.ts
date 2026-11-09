export type StopKind = 'service' | 'parking';

export type Coordinate = {
  latitude: number;
  longitude: number;
};

export type NearbyStop = {
  id: string;
  name: string;
  kind: StopKind;
  latitude: number;
  longitude: number;
  distanceKm: number;
};

export const MAX_STOPPED_SPEED_METERS_PER_SECOND = 0.3;

type OverpassElement = {
  id?: number;
  type?: string;
  lat?: number;
  lon?: number;
  center?: { lat?: number; lon?: number };
  tags?: Record<string, string>;
};

export function buildNearbyStopsQuery(
  { latitude, longitude }: Coordinate,
  radiusMeters = 5000,
): string {
  const around = `(around:${radiusMeters},${latitude},${longitude})`;
  return `[out:json][timeout:20];(node${around}["highway"~"^(services|rest_area)$"];way${around}["highway"~"^(services|rest_area)$"];relation${around}["highway"~"^(services|rest_area)$"];node${around}["amenity"="parking"];way${around}["amenity"="parking"];relation${around}["amenity"="parking"];);out center tags;`;
}

export function distanceKm(from: Coordinate, to: Coordinate): number {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDelta = radians(to.latitude - from.latitude);
  const longitudeDelta = radians(to.longitude - from.longitude);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(radians(from.latitude)) *
      Math.cos(radians(to.latitude)) *
      Math.sin(longitudeDelta / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function parseNearbyStops(
  value: unknown,
  origin: Coordinate,
): NearbyStop[] {
  if (!value || typeof value !== 'object' || !('elements' in value)) return [];
  const elements = (value as { elements?: unknown }).elements;
  if (!Array.isArray(elements)) return [];

  const stops = new Map<string, NearbyStop>();
  for (const item of elements as OverpassElement[]) {
    if (!item || typeof item !== 'object' || !item.tags || item.id === undefined) {
      continue;
    }
    const isService =
      item.tags.highway === 'services' || item.tags.highway === 'rest_area';
    const isParking = item.tags.amenity === 'parking';
    if (!isService && !isParking) continue;

    const latitude = item.lat ?? item.center?.lat;
    const longitude = item.lon ?? item.center?.lon;
    if (
      typeof latitude !== 'number' ||
      typeof longitude !== 'number' ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      continue;
    }

    const kind: StopKind = isService ? 'service' : 'parking';
    const id = `${item.type ?? 'place'}-${item.id}`;
    stops.set(id, {
      id,
      name: item.tags.name?.trim() || '',
      kind,
      latitude,
      longitude,
      distanceKm: distanceKm(origin, { latitude, longitude }),
    });
  }

  return [...stops.values()]
    .sort((left, right) => left.distanceKm - right.distanceKm)
    .slice(0, 12);
}

export function isGpsSpeedStopped(speedMetersPerSecond: number | null): boolean {
  return (
    speedMetersPerSecond !== null &&
    Number.isFinite(speedMetersPerSecond) &&
    speedMetersPerSecond >= 0 &&
    speedMetersPerSecond <= MAX_STOPPED_SPEED_METERS_PER_SECOND
  );
}

export function buildNavigationUrl(
  provider: 'google' | 'waze',
  destination: Coordinate,
): string {
  const coordinates = `${destination.latitude},${destination.longitude}`;
  return provider === 'google'
    ? `https://www.google.com/maps/dir/?api=1&destination=${coordinates}&travelmode=driving`
    : `https://waze.com/ul?ll=${coordinates}&navigate=yes`;
}
