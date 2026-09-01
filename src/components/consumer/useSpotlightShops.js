import { useEffect, useState } from "react";
import { searchShops } from "../../services/api";
import { buildSearchPayload } from "./filterConfig";
import { getCachedResults, setCachedResults } from "./exploreCache";

const useSpotlightShops = (filters, sort, coords) => {
  const [spotlightShops, setSpotlightShops] = useState(() => getCachedResults("spotlight") || []);
  const [spotlightLoading, setSpotlightLoading] = useState(() => !getCachedResults("spotlight"));

  useEffect(() => {
    const hasFilterLocation = filters.region || filters.zipCode || filters.state;
    if (!hasFilterLocation && !coords) {
      return;
    }

    let cancelled = false;
    const payload = buildSearchPayload(filters, sort);
    payload.limit = 20;
    payload.filters = { ...payload.filters, featured: true };
    if (!hasFilterLocation) Object.assign(payload, coords);
    const requestKey = JSON.stringify(payload);
    const cached = getCachedResults("spotlight", requestKey);
    if (cached) {
      setSpotlightShops(cached);
      setSpotlightLoading(false);
      return;
    }

    setSpotlightLoading(true);
    searchShops(payload)
      .then((result) => {
        if (cancelled) return;
        const shops = result?.data?.shops || [];
        const eligible = shops.filter((shop) => shop.featured === true && shop.claimed === true);
        setCachedResults("spotlight", requestKey, eligible);
        setSpotlightShops(eligible);
      })
      .catch(() => !cancelled && setSpotlightShops([]))
      .finally(() => !cancelled && setSpotlightLoading(false));

    return () => { cancelled = true; };
  }, [coords, filters, sort]);

  return { spotlightShops, spotlightLoading };
};

export default useSpotlightShops;
