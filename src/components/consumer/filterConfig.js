export const EMPTY_FILTERS = {
  radius: 50,
  region: "",
  searchType: "zip",
  zipCode: "",
  state: "",
  city: "",
  openNow: false,
  canojaVerified: false,
  cannabis: false,
  smokeShops: false,
  medical: false,
  recreational: false,
  hasMenu: false,
  spotlight: false,
};

export const REGION_LABELS = { US: "U.S", CA: "Canada", JM: "Jamaica", VI: "USVI" };

export const hasActiveFilters = (filters) => Object.entries(filters).some(([key, value]) => {
  if (["radius", "searchType"].includes(key)) return false;
  return typeof value === "boolean" ? value : Boolean(value);
});

export const buildSearchPayload = (filters, sortBy) => {
  const payload = { page: 1, limit: 10, sortBy: sortBy || undefined };
  if (!filters.region || filters.state || filters.city || filters.zipCode) payload.radius = Math.round(filters.radius * 1609.344);
  if (filters.region) payload.country = filters.region;
  if (filters.searchType === "zip" && filters.zipCode) payload.zipCode = filters.zipCode.trim();
  if (filters.searchType === "state_city" && filters.state) payload.state = filters.state.trim();
  if (filters.searchType === "state_city" && filters.city) payload.city = filters.city.trim();
  payload.filters = {
    country: filters.region || undefined,
    state: filters.searchType === "state_city" ? filters.state || undefined : undefined,
    city: filters.searchType === "state_city" ? filters.city || undefined : undefined,
    openNow: filters.openNow || undefined,
    canojaVerified: filters.canojaVerified || undefined,
    smokeShop: filters.smokeShops ? true : filters.cannabis ? false : undefined,
    cannabisType: filters.cannabis
      ? filters.medical && filters.recreational ? "both" : filters.medical ? "medical" : filters.recreational ? "recreational" : undefined
      : undefined,
    hasMenu: filters.hasMenu || undefined,
    spotlight: filters.spotlight || undefined,
  };
  return payload;
};

export const buildExplorePayload = (filters, sort, coords, query, resolvedLocation) => {
  const effectiveFilters = resolvedLocation ? { ...filters, region: resolvedLocation.country, searchType: "state_city", state: resolvedLocation.state, city: resolvedLocation.city, zipCode: "" } : filters;
  const payload = buildSearchPayload(effectiveFilters, sort);
  const hasLocation = effectiveFilters.region || effectiveFilters.zipCode || effectiveFilters.state;
  if (query.trim() && !resolvedLocation) payload.keyword = query.trim();
  if (resolvedLocation) {
    delete payload.filters.state;
    delete payload.filters.city;
    Object.assign(payload, { lat: resolvedLocation.lat, lng: resolvedLocation.lng });
  } else if (!hasLocation && coords) Object.assign(payload, coords);
  return payload;
};

export const buildLicensePayload = (filters, sort, licenseNumber) => ({
  ...buildSearchPayload(filters, sort),
  licenseNumber: licenseNumber.trim(),
  location: filters.licenseLocation || undefined,
});
