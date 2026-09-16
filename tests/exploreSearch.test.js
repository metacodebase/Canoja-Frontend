import test from 'node:test';
import assert from 'node:assert/strict';
import { EMPTY_FILTERS, buildExplorePayload } from '../src/components/consumer/filterConfig.js';
import { resolveLocationSearch } from '../src/components/consumer/locationSearch.js';

const denver = { city: 'Denver', state: 'Colorado', country: 'US', lat: 39.7392, lng: -104.9903 };

test('typed location uses its center, converts miles, and replaces saved location', () => {
  const payload = buildExplorePayload({ ...EMPTY_FILTERS, radius: 10, region: 'CA', state: 'Ontario', zipCode: 'old' }, '', { lat: 1, lng: 2 }, 'Denver, CO', denver);
  assert.equal(payload.radius, 16093);
  assert.equal(payload.country, 'US');
  assert.equal(payload.lat, denver.lat);
  assert.equal(payload.lng, denver.lng);
  assert.equal(payload.zipCode, undefined);
  assert.equal(payload.keyword, undefined);
  assert.equal(payload.filters.city, undefined); // Include nearby towns within the radius.
});

test('operator names reach backend with distance and business filters', () => {
  const payload = buildExplorePayload({ ...EMPTY_FILTERS, radius: 25, smokeShops: true }, 'rating', denver, ' Acme ', null);
  assert.equal(payload.keyword, 'Acme');
  assert.equal(payload.radius, 40234);
  assert.equal(payload.lat, denver.lat);
  assert.equal(payload.filters.smokeShop, true);
  assert.equal(payload.sortBy, 'rating');
  assert.equal(buildExplorePayload({ ...EMPTY_FILTERS, cannabis: true }, '', denver, '', null).filters.smokeShop, false);
  assert.equal(buildExplorePayload(EMPTY_FILTERS, '', denver, '', null).filters.smokeShop, undefined);
});

test('region with a city retains distance; region alone searches entire region', () => {
  assert.equal(buildExplorePayload({ ...EMPTY_FILTERS, region: 'US', state: 'Colorado', searchType: 'state_city' }, '', null, '', null).radius, 80467);
  assert.equal(buildExplorePayload({ ...EMPTY_FILTERS, region: 'US' }, '', null, '', null).radius, undefined);
});

test('geocoding supplies country and coordinates and rejects operator POIs', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => ({ ok: true, json: async () => [{ type: 'city', lat: '39.7392', lon: '-104.9903', address: { city: 'Denver', state: 'Colorado', country_code: 'us' } }] });
    assert.deepEqual(await resolveLocationSearch('Denver, CO'), denver);
    globalThis.fetch = async () => ({ ok: true, json: async () => [{ type: 'shop', address: { city: 'Denver', state: 'Colorado' } }] });
    assert.equal(await resolveLocationSearch('Acme'), null);
  } finally { globalThis.fetch = originalFetch; }
});
