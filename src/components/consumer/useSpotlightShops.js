import { useEffect, useState } from "react";
import { getSpotlightShops, searchShops } from "../../services/api";
import { buildSearchPayload } from "./filterConfig";
import { getCachedResults, setCachedResults } from "./exploreCache";

const CACHE_SECTION = "spotlight-paid";

const useSpotlightShops = (filters, sort, coords) => {
  const [spotlightShops, setSpotlightShops] = useState(() => getCachedResults(CACHE_SECTION) || []);
  const [spotlightLoading, setSpotlightLoading] = useState(() => !getCachedResults(CACHE_SECTION));

  useEffect(() => {
    const hasFilterLocation = filters.region || filters.zipCode || filters.state;
    const hasLocation = hasFilterLocation || coords;

    let cancelled = false;
    const payload = buildSearchPayload(filters, sort);
    payload.limit = 20;
    payload.filters = { ...payload.filters, featured: true };
    if (!hasFilterLocation) Object.assign(payload, coords);
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
  }, [coords, filters, sort]);

  return { spotlightShops, spotlightLoading };
};

export default useSpotlightShops;
