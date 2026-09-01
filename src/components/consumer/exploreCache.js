const CACHE_KEY = "consumerExploreResults";
const CACHE_TTL = 5 * 60 * 1000;

const readCache = () => {
  try {
    return JSON.parse(sessionStorage.getItem(CACHE_KEY)) || {};
  } catch {
    return {};
  }
};

export const getCachedResults = (section, requestKey) => {
  const entry = readCache()[section];
  if (!entry || Date.now() - entry.savedAt > CACHE_TTL) return null;
  if (requestKey && entry.requestKey !== requestKey) return null;
  return entry.shops;
};

export const setCachedResults = (section, requestKey, shops) => {
  const cache = readCache();
  cache[section] = { requestKey, shops, savedAt: Date.now() };
  sessionStorage.setItem(CACHE_KEY, JSON.stringify(cache));
};
