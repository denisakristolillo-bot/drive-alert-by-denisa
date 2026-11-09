import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useIsFocused } from 'expo-router';
import type * as LocationTypes from 'expo-location';
import {
  Linking,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  AppScreen,
  BodyText,
  PageHeading,
  Panel,
  PrimaryButton,
  SecondaryButton,
} from '@/components/AppUI';
import { useColors } from '@/hooks/useColors';
import { useLocale } from '@/hooks/useLocale';
import {
  buildNavigationUrl,
  buildNearbyStopsQuery,
  isGpsSpeedStopped,
  MAX_STOPPED_SPEED_METERS_PER_SECOND,
  parseNearbyStops,
} from '@/logic/stopFinder';
import type { Coordinate, NearbyStop } from '@/logic/stopFinder';

type PositionSnapshot = Coordinate & {
  speed: number | null;
  accuracy: number | null;
  timestamp: number;
};

type SearchState = 'idle' | 'loading' | 'ready' | 'network-error' | 'error';

const STOP_CONFIRMATION_MS = 5000;
const LOCATION_FRESH_MS = 15000;

export default function StopsScreen() {
  const colors = useColors();
  const { t } = useLocale();
  const isFocused = useIsFocused();
  const [position, setPosition] = useState<PositionSnapshot | null>(null);
  const [stops, setStops] = useState<NearbyStop[]>([]);
  const [searchState, setSearchState] = useState<SearchState>('idle');
  const [isLocating, setIsLocating] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [canAskAgain, setCanAskAgain] = useState(true);
  const [locationUnavailable, setLocationUnavailable] = useState(false);
  const [positionStale, setPositionStale] = useState(false);
  const [isStopped, setIsStopped] = useState(false);
  const [routeError, setRouteError] = useState(false);
  const watchRef = useRef<LocationTypes.LocationSubscription | null>(null);
  const positionRef = useRef<PositionSnapshot | null>(null);
  const stationarySinceRef = useRef<number | null>(null);
  const positionStaleRef = useRef(false);

  const setPositionSnapshot = useCallback((snapshot: PositionSnapshot) => {
    if (positionStaleRef.current) stationarySinceRef.current = null;
    positionStaleRef.current = false;
    setPositionStale(false);
    positionRef.current = snapshot;
    setPosition(snapshot);
    if (!isGpsSpeedStopped(snapshot.speed)) {
      stationarySinceRef.current = null;
      setIsStopped(false);
    } else if (stationarySinceRef.current === null) {
      stationarySinceRef.current = Date.now();
      setIsStopped(false);
    }
  }, []);

  const searchNearby = useCallback(
    async (origin: Coordinate) => {
      setSearchState('loading');
      try {
        const response = await fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `data=${encodeURIComponent(buildNearbyStopsQuery(origin))}`,
        });
        if (!response.ok) {
          setSearchState('network-error');
          return;
        }
        const data: unknown = await response.json();
        setStops(parseNearbyStops(data, origin));
        setSearchState('ready');
      } catch {
        setSearchState('network-error');
      }
    },
    [],
  );

  const startLocation = useCallback(async () => {
    if (Platform.OS === 'web') {
      if (!navigator.geolocation) {
        setLocationUnavailable(true);
        return;
      }
      setIsLocating(true);
      setPermissionDenied(false);
      setLocationUnavailable(false);
      navigator.geolocation.getCurrentPosition(
        (result) => {
          const snapshot: PositionSnapshot = {
            latitude: result.coords.latitude,
            longitude: result.coords.longitude,
            speed:
              typeof result.coords.speed === 'number' &&
              Number.isFinite(result.coords.speed)
                ? result.coords.speed
                : null,
            accuracy: result.coords.accuracy,
            timestamp: result.timestamp,
          };
          setPositionSnapshot(snapshot);
          setIsLocating(false);
          void searchNearby(snapshot);
        },
        (error) => {
          setIsLocating(false);
          if (error.code === error.PERMISSION_DENIED) {
            setPermissionDenied(true);
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            setLocationUnavailable(true);
          } else {
            setSearchState('error');
          }
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
      );
      return;
    }

    setIsLocating(true);
    setPermissionDenied(false);
    setLocationUnavailable(false);
    try {
      const Location = await import('expo-location');
      let permission = await Location.getForegroundPermissionsAsync();
      if (!permission.granted) {
        permission = await Location.requestForegroundPermissionsAsync();
      }
      setCanAskAgain(permission.canAskAgain);
      if (!permission.granted) {
        setPermissionDenied(true);
        setIsLocating(false);
        return;
      }

      if (!(await Location.hasServicesEnabledAsync())) {
        setLocationUnavailable(true);
        setIsLocating(false);
        return;
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const snapshot: PositionSnapshot = {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
        speed:
          typeof current.coords.speed === 'number' &&
          Number.isFinite(current.coords.speed)
            ? current.coords.speed
            : null,
        accuracy: current.coords.accuracy,
        timestamp: current.timestamp,
      };
      setPositionSnapshot(snapshot);
      setIsLocating(false);
      void searchNearby(snapshot);

      watchRef.current?.remove();
      watchRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 3000,
          distanceInterval: 5,
        },
        (update) => {
          setPositionSnapshot({
            latitude: update.coords.latitude,
            longitude: update.coords.longitude,
            speed:
              typeof update.coords.speed === 'number' &&
              Number.isFinite(update.coords.speed)
                ? update.coords.speed
                : null,
            accuracy: update.coords.accuracy,
            timestamp: update.timestamp,
          });
        },
      );
    } catch {
      setIsLocating(false);
      setLocationUnavailable(true);
    }
  }, [searchNearby, setPositionSnapshot]);

  const stopLocationWatch = useCallback(() => {
    watchRef.current?.remove();
    watchRef.current = null;
    stationarySinceRef.current = null;
    setIsStopped(false);
  }, []);

  useFocusEffect(
    useCallback(
      () => () => {
        stopLocationWatch();
      },
      [stopLocationWatch],
    ),
  );

  useEffect(() => {
    if (!isFocused) return;
    const timer = setInterval(() => {
      const latest = positionRef.current;
      if (!latest || Date.now() - latest.timestamp > LOCATION_FRESH_MS) {
        positionStaleRef.current = latest !== null;
        setPositionStale(latest !== null);
        stationarySinceRef.current = null;
        setIsStopped(false);
        return;
      }
      if (!isGpsSpeedStopped(latest.speed)) {
        stationarySinceRef.current = null;
        setIsStopped(false);
        return;
      }
      if (stationarySinceRef.current === null) {
        stationarySinceRef.current = Date.now();
      }
      setIsStopped(Date.now() - stationarySinceRef.current >= STOP_CONFIRMATION_MS);
    }, 1000);
    return () => clearInterval(timer);
  }, [isFocused]);

  const openNavigation = useCallback(
    async (provider: 'google' | 'waze', destination: Coordinate) => {
      const latest = positionRef.current;
      const isFresh =
        latest !== null && Date.now() - latest.timestamp <= LOCATION_FRESH_MS;
      const confirmedStopped =
        isFresh &&
        isGpsSpeedStopped(latest?.speed ?? null) &&
        stationarySinceRef.current !== null &&
        Date.now() - stationarySinceRef.current >= STOP_CONFIRMATION_MS;
      if (!isFocused || !confirmedStopped) {
        setIsStopped(false);
        return;
      }
      setRouteError(false);
      try {
        await Linking.openURL(buildNavigationUrl(provider, destination));
      } catch {
        setRouteError(true);
      }
    },
    [isFocused],
  );

  const visibleStatus = position
    ? positionStale || locationUnavailable
      ? t.stopsLocationUnavailable
      : isStopped
      ? t.stopsStopped
      : position.speed !== null &&
          position.speed > MAX_STOPPED_SPEED_METERS_PER_SECOND
        ? t.stopsMoving
        : t.stopsVehicleUnknown
    : t.stopsLocationUnavailable;
  const navigationAllowed =
    isFocused &&
    isStopped &&
    position !== null &&
    Date.now() - position.timestamp <= LOCATION_FRESH_MS;

  return (
    <AppScreen>
      <PageHeading
        eyebrow="DRIVE ALERT"
        title={t.stopsTitle}
        subtitle={t.stopsSubtitle}
      />

      {Platform.OS === 'web' ? (
        <Panel style={styles.noticePanel}>
          <Feather name="smartphone" size={23} color={colors.accent} />
          <BodyText>{t.stopsWebUnsupported}</BodyText>
        </Panel>
      ) : null}

      {Platform.OS !== 'web' && !position ? (
        <Panel style={styles.locationPanel}>
          <View style={styles.panelHeading}>
            <Feather name="map-pin" size={21} color={colors.accent} />
            <Text style={[styles.panelTitle, { color: colors.foreground }]}>
              {t.stopsPositionLabel}
            </Text>
          </View>
          <BodyText>{t.stopsPrivacy}</BodyText>
          {permissionDenied ? (
            <Text style={[styles.errorText, { color: colors.destructive }]}>
              {canAskAgain ? t.stopsPermissionNeeded : t.stopsLocationDenied}
            </Text>
          ) : null}
          {locationUnavailable ? (
            <Text style={[styles.errorText, { color: colors.destructive }]}>
              {t.stopsNoGps}
            </Text>
          ) : null}
          <PrimaryButton
            label={isLocating ? t.stopsSearching : t.stopsEnableLocation}
            onPress={startLocation}
            disabled={isLocating}
            testID="enable-location-and-search"
          />
          {permissionDenied && !canAskAgain ? (
            <SecondaryButton
              label={t.stopsSettings}
              onPress={() => Linking.openSettings().catch(() => undefined)}
              testID="open-location-settings"
            />
          ) : null}
        </Panel>
      ) : null}

      {position ? (
        <Panel style={styles.locationPanel}>
          <View style={styles.panelHeading}>
            <Feather name="map-pin" size={21} color={colors.accent} />
            <Text style={[styles.panelTitle, { color: colors.foreground }]}>
              {t.stopsPositionLabel}
            </Text>
          </View>
          <Text style={[styles.coordinates, { color: colors.foreground }]}>
            {position.latitude.toFixed(5)}, {position.longitude.toFixed(5)}
          </Text>
          <View style={styles.metricsRow}>
            <Text style={[styles.metric, { color: colors.mutedForeground }]}>
              {t.stopsSpeedLabel}:{' '}
              {position.speed === null
                ? '—'
                : `${(position.speed * 3.6).toFixed(1)} km/h`}
            </Text>
            <Text
              style={[
                styles.vehicleStatus,
                { color: isStopped ? colors.accent : colors.mutedForeground },
              ]}
            >
              {visibleStatus}
            </Text>
          </View>
          {position.accuracy !== null ? (
            <BodyText>
              ±{Math.round(position.accuracy)} m ·{' '}
              {new Date(position.timestamp).toLocaleTimeString()}
            </BodyText>
          ) : null}
          {locationUnavailable ? (
            <Text style={[styles.errorText, { color: colors.destructive }]}>
              {t.stopsLocationUnavailable}
            </Text>
          ) : null}
          {positionStale ? (
            <Text style={[styles.errorText, { color: colors.destructive }]}>
              {t.stopsLocationUnavailable}
            </Text>
          ) : null}
          {positionStale || locationUnavailable ? (
            <PrimaryButton
              label={isLocating ? t.stopsSearching : t.stopsEnableLocation}
              onPress={startLocation}
              disabled={isLocating}
              testID="retry-location"
            />
          ) : null}
          <BodyText>{t.stopsPrivacy}</BodyText>
        </Panel>
      ) : null}

      {position ? (
        <Panel>
          <View style={styles.panelHeading}>
            <Feather name="map" size={21} color={colors.accent} />
            <Text style={[styles.panelTitle, { color: colors.foreground }]}>
              {t.stopsSuggestions}
            </Text>
          </View>
          {searchState === 'loading' ? (
            <BodyText>{t.stopsSearching}</BodyText>
          ) : searchState === 'network-error' ? (
            <Text style={[styles.errorText, { color: colors.destructive }]}>
              {t.stopsNetworkUnavailable}
            </Text>
          ) : searchState === 'error' ? (
            <Text style={[styles.errorText, { color: colors.destructive }]}>
              {t.stopsSearchError}
            </Text>
          ) : searchState === 'ready' && stops.length === 0 ? (
            <BodyText>{t.stopsNoSuggestions}</BodyText>
          ) : null}

          {stops.map((stop) => (
            <View
              key={stop.id}
              style={[styles.stopCard, { borderColor: colors.border }]}
              testID={`nearby-stop-${stop.id}`}
            >
              <View style={styles.stopTitleRow}>
                <Feather
                  name={stop.kind === 'service' ? 'coffee' : 'truck'}
                  size={18}
                  color={colors.accent}
                />
                <Text style={[styles.stopName, { color: colors.foreground }]}>
                  {stop.name ||
                    (stop.kind === 'service'
                      ? t.stopsServiceArea
                      : t.stopsParking)}
                </Text>
              </View>
              <Text style={[styles.stopMeta, { color: colors.mutedForeground }]}>
                {stop.kind === 'service'
                  ? t.stopsServiceArea
                  : t.stopsParking}{' '}
                · {stop.distanceKm.toFixed(1)} km
              </Text>
              {!navigationAllowed ? (
                <BodyText>{t.stopsRouteParked}</BodyText>
              ) : null}
              <PrimaryButton
                label={t.stopsGoogleMaps}
                onPress={() =>
                  void openNavigation('google', {
                    latitude: stop.latitude,
                    longitude: stop.longitude,
                  })
                }
                disabled={!navigationAllowed}
                testID={`navigate-google-${stop.id}`}
              />
              <SecondaryButton
                label={t.stopsWaze}
                onPress={() =>
                  void openNavigation('waze', {
                    latitude: stop.latitude,
                    longitude: stop.longitude,
                  })
                }
                disabled={!navigationAllowed}
                testID={`navigate-waze-${stop.id}`}
              />
            </View>
          ))}
          <SecondaryButton
            label={searchState === 'loading' ? t.stopsSearching : t.stopsRefresh}
            onPress={() => void searchNearby(position)}
            disabled={searchState === 'loading'}
            testID="refresh-nearby-stops"
          />
        </Panel>
      ) : null}

      {routeError ? (
        <Panel>
          <Text style={[styles.errorText, { color: colors.destructive }]}>
            {t.stopsRouteError}
          </Text>
        </Panel>
      ) : null}

      <Panel style={[styles.disclaimerPanel, { borderColor: colors.border }]}>
        <View style={styles.panelHeading}>
          <Feather name="info" size={19} color={colors.accent} />
          <Text style={[styles.panelTitle, { color: colors.foreground }]}>
            {t.stopsDisclaimer}
          </Text>
        </View>
      </Panel>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  locationPanel: { gap: 14 },
  noticePanel: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  panelHeading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  panelTitle: { flex: 1, fontSize: 16, fontWeight: '700', lineHeight: 22 },
  coordinates: { fontSize: 20, fontWeight: '700', fontVariant: ['tabular-nums'] },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  metric: { fontSize: 15, fontWeight: '600' },
  vehicleStatus: { fontSize: 14, fontWeight: '700' },
  errorText: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
  stopCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  stopTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stopName: { flex: 1, fontSize: 16, fontWeight: '700' },
  stopMeta: { fontSize: 13, lineHeight: 18 },
  disclaimerPanel: { borderLeftWidth: 3 },
});
