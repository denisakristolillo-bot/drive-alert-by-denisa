import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildNavigationUrl,
  buildNearbyStopsQuery,
  distanceKm,
  isGpsSpeedStopped,
  parseNearbyStops,
} from './stopFinder.ts';

test('nearby query searches service areas and parking in a bounded radius', () => {
  const query = buildNearbyStopsQuery({ latitude: 45.5, longitude: 9.2 });
  assert.match(query, /around:5000,45\.5,9\.2/);
  assert.match(query, /"highway"~"\^\(services\|rest_area\)\$"/);
  assert.match(query, /"amenity"="parking"/);
});

test('parses named and unnamed stops and sorts them by distance', () => {
  const stops = parseNearbyStops(
    {
      elements: [
        {
          id: 2,
          type: 'way',
          center: { lat: 45.51, lon: 9.2 },
          tags: { amenity: 'parking', name: 'Parcheggio' },
        },
        {
          id: 1,
          type: 'node',
          lat: 45.5005,
          lon: 9.2,
          tags: { highway: 'services' },
        },
        {
          id: 3,
          type: 'node',
          lat: 45.5,
          lon: 9.2,
          tags: { amenity: 'cafe' },
        },
      ],
    },
    { latitude: 45.5, longitude: 9.2 },
  );

  assert.equal(stops.length, 2);
  assert.equal(stops[0].kind, 'service');
  assert.equal(stops[0].name, '');
  assert.equal(stops[1].name, 'Parcheggio');
  assert.ok(stops[0].distanceKm < stops[1].distanceKm);
});

test('calculates distance and treats only low valid GPS speeds as stopped', () => {
  assert.ok(Math.abs(distanceKm({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 1 }) - 111.2) < 0.5);
  assert.equal(isGpsSpeedStopped(0), true);
  assert.equal(isGpsSpeedStopped(0.3), true);
  assert.equal(isGpsSpeedStopped(0.31), false);
  assert.equal(isGpsSpeedStopped(null), false);
  assert.equal(isGpsSpeedStopped(-1), false);
});

test('builds provider-specific driving directions', () => {
  const point = { latitude: 45.5, longitude: 9.2 };
  assert.match(buildNavigationUrl('google', point), /google\.com\/maps\/dir/);
  assert.match(buildNavigationUrl('google', point), /destination=45\.5,9\.2/);
  assert.match(buildNavigationUrl('waze', point), /waze\.com\/ul\?ll=45\.5,9\.2&navigate=yes/);
});
