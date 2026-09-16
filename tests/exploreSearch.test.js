import { orderMapShops, allSectionShops } from '../src/components/consumer/mapShopOrdering.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { EMPTY_FILTERS, buildExplorePayload, buildLicensePayload } from '../src/components/consumer/filterConfig.js';
import { applyLandingLocation } from '../src/components/consumer/landingSearchState.js';
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

test('landing locations populate filters with an empty search; operator names remain searchable', () => {
  const initial = { filters: { ...EMPTY_FILTERS, radius: 50 }, query: "", initializing: true };
  const locationState = applyLandingLocation(initial, 'Denver, CO', denver);
  assert.equal(locationState.query, '');
  assert.equal(locationState.filters.state, 'Colorado');
  assert.equal(locationState.filters.city, 'Denver');
  assert.equal(locationState.filters.region, 'US');
  assert.equal(locationState.filters.radius, 50);
  assert.equal(locationState.initializing, false);
  assert.equal(applyLandingLocation(initial, 'Acme', null).query, 'Acme');
});

test('license location is kept in filters, without populating operator search text', () => {
  const initial = { filters: { ...EMPTY_FILTERS }, query: '', licenseNumber: 'ABC-123' };
  const resolved = applyLandingLocation(initial, 'Denver, CO', denver, true);
  assert.equal(resolved.query, '');
  assert.equal(resolved.licenseNumber, 'ABC-123');
  const payload = buildLicensePayload(resolved.filters, '', resolved.licenseNumber);
  assert.equal(payload.licenseNumber, 'ABC-123');
  assert.equal(payload.state, 'Colorado');
  assert.equal(payload.city, 'Denver');
  assert.equal(payload.location, undefined);
  const fallback = applyLandingLocation(initial, 'CO', null, true);
  assert.equal(fallback.query, '');
  assert.equal(buildLicensePayload(fallback.filters, '', ' ABC-123 ').location, 'CO');
  assert.equal(buildLicensePayload({ ...EMPTY_FILTERS }, '', 'NEW').location, undefined);
});

test('paid maps put Spotlight first, preserve secondary ordering, and deduplicate', () => {
  const shops = [{_id:'normal', featured:false}, {_id:'paid1', featured:true, spotlight:true, claimed:true, plan_tier:'starter'}, {_id:'paid2', featured:true, spotlight:true, claimed:true, plan_tier:'starter'}, {_id:'normal', featured:false}];
  assert.deepEqual(orderMapShops(shops, true).map(s => s._id), ['paid1', 'paid2', 'normal']);
  assert.deepEqual(orderMapShops(shops, false).map(s => s._id), ['normal', 'paid1', 'paid2']);
  assert.deepEqual(allSectionShops(shops).map(s => s._id), ['paid1', 'paid2', 'normal']);
  assert.equal(allSectionShops(shops, false).length, 3);
  assert.equal(shops[0]._id, 'normal');
});

test('Spotlight listings are excluded from All but appear once at the front of the map', () => {
  const spotlight = {_id:'spot', spotlight:true, claimed:true, plan_tier:'starter', featured:true};
  const featured = {_id:'paid', featured:true, spotlight:false};
  const normal = {_id:'normal', featured:false, spotlight:false};
  const ineligible = {_id:'inactive', spotlight:true, claimed:false, plan_tier:'free'};
  const shops = [normal, featured, spotlight, ineligible];
  assert.deepEqual(allSectionShops(shops, true, [spotlight]).map(s => s._id), ['paid', 'normal', 'inactive']);
  const map = orderMapShops([spotlight, ...shops], true);
  assert.equal(map[0]._id, 'spot');
  assert.equal(map.filter(s => s._id === 'spot').length, 1);
  assert.equal(allSectionShops(shops, false).length, 4);
});

test('Featured and Spotlight share the same shop designation', () => {
  const enabled = {_id:'enabled', featured:true, claimed:true, plan_tier:'starter'};
  const disabled = {_id:'disabled', featured:false, spotlight:true, claimed:true, plan_tier:'starter'};
  assert.equal(orderMapShops([disabled, enabled], true)[0]._id, 'enabled');
  assert.deepEqual(allSectionShops([enabled, disabled], true).map(s => s._id), ['disabled']);
});
