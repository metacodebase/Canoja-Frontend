export const applyLandingLocation = (state, input, location, licenseSearch = false) => ({
  ...state,
  initializing: false,
  query: location || licenseSearch ? "" : input,
  filters: location ? {
    ...state.filters,
    region: location.country,
    searchType: "state_city",
    state: location.state,
    city: location.city,
    zipCode: "",
  } : licenseSearch ? { ...state.filters, licenseLocation: input } : state.filters,
});
