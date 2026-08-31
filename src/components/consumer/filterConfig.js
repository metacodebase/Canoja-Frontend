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
  const payload = { page: 1, limit: 30, sortBy: sortBy || undefined };
  if (!filters.region) payload.radius = filters.radius;
  if (filters.region) payload.country = filters.region;
  if (filters.searchType === "zip" && filters.zipCode) payload.zipCode = filters.zipCode.trim();
  if (filters.searchType === "state_city" && filters.state) payload.state = filters.state.trim();
  if (filters.searchType === "state_city" && filters.city) payload.city = filters.city.trim();
  payload.filters = {
    openNow: filters.openNow || undefined,
    canojaVerified: filters.canojaVerified || undefined,
    smokeShop: filters.smokeShops ? true : filters.cannabis ? false : undefined,
    cannabisType: filters.cannabis
      ? filters.medical && filters.recreational ? "both" : filters.medical ? "medical" : filters.recreational ? "recreational" : undefined
      : undefined,
    hasMenu: filters.hasMenu || undefined,
    featured: filters.spotlight || undefined,
  };
  return payload;
};
