import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { searchShops } from "../../services/api";
import BusinessCard from "./BusinessCard";
import ExploreHeader from "./ExploreHeader";
import { buildSearchPayload, EMPTY_FILTERS } from "./filterConfig";
import useBrowserLocation from "./useBrowserLocation";
import useAdminTheme from "../admin/useAdminTheme";
import "./consumerExplore.css";

const getShopKey = (shop) => shop._id || shop.place_id || shop.id;

const ConsumerAllShops = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useAdminTheme();
  const { state } = useLocation();
  const filters = state?.filters || EMPTY_FILTERS;
  const sort = state?.sort || "";
  const query = state?.query?.trim() || "";
  const [shops, setShops] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const observer = useRef(null);
  const { coords, locating, locationError } = useBrowserLocation();

  const loadPage = useCallback(async (pageNumber, cancelled = () => false) => {
    setLoading(true);
    const payload = { ...buildSearchPayload(filters, sort), page: pageNumber, limit: 10 };
    if (query) payload.keyword = query;
    const hasFilterLocation = filters.region || filters.zipCode || filters.state;
    if (!query && !hasFilterLocation && !coords) {
      setLoading(locating);
      setHasMore(false);
      return;
    }
    if (!query && !hasFilterLocation) Object.assign(payload, coords);

    try {
      const result = await searchShops(payload);
      if (cancelled()) return;
      const nextShops = result?.data?.shops || [];
      setShops((current) => {
        const known = new Set(current.map(getShopKey));
        return [...current, ...nextShops.filter((shop) => !known.has(getShopKey(shop)))];
      });
      setHasMore(result?.data?.pagination?.has_more ?? nextShops.length === 10);
    } catch {
      if (!cancelled()) setHasMore(false);
    } finally {
      if (!cancelled()) setLoading(false);
    }
  }, [coords, filters, locating, query, sort]);

  useEffect(() => {
    let cancelled = false;
    loadPage(page, () => cancelled);
    return () => { cancelled = true; };
  }, [loadPage, page]);

  const lastCardRef = useCallback((node) => {
    observer.current?.disconnect();
    if (!node || loading || !hasMore) return;
    observer.current = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setPage((current) => current + 1);
    }, { rootMargin: "240px" });
    observer.current.observe(node);
  }, [hasMore, loading]);

  return (
    <div className={`admin-theme operator-theme admin-theme--${theme}`}>
      <main className="consumer-explore">
        <div className="consumer-shell">
        <ExploreHeader view="list" onViewChange={() => navigate("/explore")} theme={theme} onThemeToggle={toggleTheme} />
        <div className="all-shops-heading">
          <button onClick={() => navigate(-1)} aria-label="Back to Explore">‹</button>
          <h2>All operators</h2>
        </div>
        <div className="business-list">
          {shops.map((shop, index) => <div key={getShopKey(shop) || index} ref={index === shops.length - 1 ? lastCardRef : null}><BusinessCard shop={shop} /></div>)}
        </div>
        {loading && <div className="consumer-state all-shops-loading">Loading more operators…</div>}
        {!loading && !shops.length && <div className="consumer-state">{locationError || "No operators found near this location."}</div>}
        </div>
      </main>
    </div>
  );
};

export default ConsumerAllShops;
