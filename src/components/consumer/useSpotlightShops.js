import { useEffect, useState } from "react";
import { searchShops } from "../../services/api";
import { buildSearchPayload } from "./filterConfig";

const useSpotlightShops = (filters, sort, coords) => {
  const [spotlightShops, setSpotlightShops] = useState([]);
  const [spotlightLoading, setSpotlightLoading] = useState(false);

  useEffect(() => {
    const hasFilterLocation = filters.region || filters.zipCode || filters.state;
    if (!hasFilterLocation && !coords) {
      setSpotlightShops([]);
      return;
    }

    let cancelled = false;
    const payload = buildSearchPayload(filters, sort);
    payload.limit = 20;
    payload.filters = { ...payload.filters, featured: true };
    if (!hasFilterLocation) Object.assign(payload, coords);

    setSpotlightLoading(true);
    searchShops(payload)
      .then((result) => {
        if (cancelled) return;
        const shops = result?.data?.shops || [];
        setSpotlightShops(shops.filter((shop) => shop.featured === true && shop.claimed === true));
      })
      .catch(() => !cancelled && setSpotlightShops([]))
      .finally(() => !cancelled && setSpotlightLoading(false));

    return () => { cancelled = true; };
  }, [coords, filters, sort]);

  return { spotlightShops, spotlightLoading };
};

export default useSpotlightShops;
