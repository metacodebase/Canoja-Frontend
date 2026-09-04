import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { searchShops } from "../../services/api";
import ExploreControls from "./ExploreControls";
import ExploreFilterPanel from "./ExploreFilterPanel";
import ExploreHeader from "./ExploreHeader";
import ExploreMap from "./ExploreMap";
import ExploreSection from "./ExploreSection";
import { getCachedResults, setCachedResults } from "./exploreCache";
import { buildSearchPayload, hasActiveFilters } from "./filterConfig";
import useBrowserLocation from "./useBrowserLocation";
import useExploreState from "./useExploreState";
import useSpotlightShops from "./useSpotlightShops";
import useAdminTheme from "../admin/useAdminTheme";
import { resolveLocationSearch } from "./locationSearch";
import "./consumerExplore.css";

const ConsumerExplore = ({ embedded = false, themeOverride }) => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useAdminTheme();
  const activeTheme = themeOverride || theme;
  const [shops, setShops] = useState(() => getCachedResults("all") || []);
  const [loading, setLoading] = useState(() => !getCachedResults("all"));
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchLocation, setSearchLocation] = useState(null);
  const { filters, setFilters, query, setQuery, view, setView, sort, setSort } = useExploreState();
  const { coords, locating, locationError } = useBrowserLocation();
  const { spotlightShops, spotlightLoading } = useSpotlightShops(filters, sort, coords);
  const openShop = useCallback((shop) => {
    const businessId = shop._id || shop.place_id || shop.id || "selected";
    sessionStorage.setItem("selectedBusiness", JSON.stringify(shop));
    navigate(`/business/${encodeURIComponent(businessId)}`, { state: { business: shop } });
  }, [navigate]);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      const resolved = await resolveLocationSearch(query);
      if (!cancelled) setSearchLocation(resolved ? { query, ...resolved } : null);
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const activeSearchLocation = searchLocation?.query === query ? searchLocation : null;

  useEffect(() => {
    const payload = buildSearchPayload(filters, sort);
    const hasFilterLocation = filters.region || filters.zipCode || filters.state || activeSearchLocation;
    if (!hasFilterLocation && !coords) {
      setLoading(locating && shops.length === 0);
      return;
    }
    if (activeSearchLocation) {
      payload.state = activeSearchLocation.state;
      payload.city = activeSearchLocation.city;
      payload.limit = 1000;
    }
    if (!hasFilterLocation) Object.assign(payload, coords);
    const requestKey = JSON.stringify(payload);
    const cached = getCachedResults("all", requestKey);
    if (cached) {
      setShops(cached);
      setLoading(false);
      return;
    }
    setLoading(true);
    searchShops(payload)
      .then((result) => {
        const nextShops = result?.data?.shops || [];
        setCachedResults("all", requestKey, nextShops);
        setShops(nextShops);
      })
      .catch(() => setShops([]))
      .finally(() => setLoading(false));
  }, [coords, filters, locating, shops.length, sort, activeSearchLocation]);

  const visibleShops = useMemo(() => {
    const term = query.trim().toLowerCase();
    const filtered = shops.filter((shop) => {
      const matchesSearch = activeSearchLocation || !term || `${shop.name} ${shop.address} ${shop.found_by_query}`.toLowerCase().includes(term);
      return matchesSearch;
    });
    return [...filtered].sort((a, b) => sort === "rating"
      ? (b.rating || 0) - (a.rating || 0)
      : sort === "alphabetical" ? (a.name || "").localeCompare(b.name || "") : 0);
  }, [query, activeSearchLocation, shops, sort]);

  return (
    <div className={embedded ? "consumer-theme" : `admin-theme operator-theme admin-theme--${theme}`}>
      <main className="consumer-explore">
        <div className="consumer-shell">
        <ExploreHeader view={view} onViewChange={setView} theme={activeTheme} onThemeToggle={toggleTheme} />
        <ExploreControls query={query} onQueryChange={setQuery} filtersOpen={filtersOpen || hasActiveFilters(filters)} onFiltersToggle={() => setFiltersOpen(true)} sort={sort} onSortChange={setSort} />
        {filtersOpen && <ExploreFilterPanel value={filters} onClose={() => setFiltersOpen(false)} onApply={(nextFilters) => { setFilters(nextFilters); setFiltersOpen(false); }} />}
        {view === "map" ? <ExploreMap shops={visibleShops} coords={coords} locating={locating} locationError={locationError} onShopSelect={openShop} theme={activeTheme} /> : <>
          <ExploreSection title="Spotlight" shops={spotlightShops} spotlight emptyText={filters.region || filters.zipCode || filters.state ? "No spotlight operators match this location." : locationError || "No spotlight operators yet."} loading={spotlightLoading || (!(filters.region || filters.zipCode || filters.state) && locating)} />
          <ExploreSection
            title="All"
            shops={visibleShops.slice(0, 6)}
            emptyText={locationError || "No operators found near this location."}
            loading={loading}
            onSeeAll={() => navigate("/explore/all", { state: { filters, sort, query } })}
          />
        </>}
        </div>
      </main>
    </div>
  );
};

export default ConsumerExplore;
