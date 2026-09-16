export const applyLandingLocation = (state, input, location) => ({
  ...state,
  initializing: false,
  query: location ? "" : input,
  filters: location ? {
    ...state.filters,
    region: location.country,
    searchType: "state_city",
    state: location.state,
    city: location.city,
    zipCode: "",
  } : state.filters,
});
