const LOCATION_TYPES = new Set([
  "city",
  "town",
  "village",
  "hamlet",
  "suburb",
  "county",
  "state",
  "administrative",
]);

export const resolveLocationSearch = async (query) => {
  const value = query.trim();
  if (!value || value.length < 3) return null;

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=1&q=${encodeURIComponent(value)}`,
    );
    if (!response.ok) return null;

    const [result] = await response.json();
    const address = result?.address || {};
    const city = address.city || address.town || address.village || address.municipality;
    const state = address.state || address.province || address.region;

    if (!city || !state || !LOCATION_TYPES.has(result.type || result.addresstype)) {
      return null;
    }

    return { city: String(city).trim(), state: String(state).trim() };
  } catch {
    return null;
  }
};
