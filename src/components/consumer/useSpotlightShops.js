import { useEffect, useState } from "react";
import { getSpotlightShops, searchShops } from "../../services/api";
import { buildExplorePayload } from "./filterConfig";
import { getCachedResults, setCachedResults } from "./exploreCache";

const CACHE_SECTION = "spotlight-paid";

const useSpotlightShops = (filters, sort, coords, enabled = true, query = "", resolvedLocation = null, resolving = false) => {
  const [spotlightShops, setSpotlightShops] = useState([]);
  const [spotlightLoading, setSpotlightLoading] = useState(() => !getCachedResults(CACHE_SECTION));

  useEffect(() => {
    if (resolving) return;
    if (!enabled) {
      setSpotlightShops([]);
      setSpotlightLoading(false);
      return undefined;
    }

    const hasFilterLocation = filters.region || filters.zipCode || filters.state || resolvedLocation;
    const hasLocation = hasFilterLocation || coords;
    if (!hasLocation && query.trim()) {
      setSpotlightShops([]);
      setSpotlightLoading(false);
      return;
    }

    let cancelled = false;
    const payload = buildExplorePayload(filters, sort, coords, query, resolvedLocation);
    payload.limit = 20;
    payload.filters = { ...payload.filters, featured: true };
    const requestKey = hasLocation ? JSON.stringify(payload) : "global";
    const cached = getCachedResults(CACHE_SECTION, requestKey);
    if (cached) {
      setSpotlightShops(cached);
      setSpotlightLoading(false);
      return;
    }

    setSpotlightLoading(true);
    const request = hasLocation ? searchShops(payload) : getSpotlightShops({ limit: 20 });
    request
      .then((result) => {
        if (cancelled) return;
        const shops = result?.data?.shops || [];
        const eligible = shops.filter((shop) => shop.featured === true && shop.claimed === true);
        setCachedResults(CACHE_SECTION, requestKey, eligible);
        setSpotlightShops(eligible);
      })
      .catch(() => !cancelled && setSpotlightShops([]))
      .finally(() => !cancelled && setSpotlightLoading(false));

    return () => { cancelled = true; };
  }, [coords, enabled, filters, sort, query, resolvedLocation, resolving]);

  return { spotlightShops, spotlightLoading };
};

export default useSpotlightShops;
