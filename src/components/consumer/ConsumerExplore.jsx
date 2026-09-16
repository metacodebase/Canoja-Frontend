import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { searchShops } from "../../services/api";
import ExploreControls from "./ExploreControls";
import ExploreFilterPanel from "./ExploreFilterPanel";
import ExploreHeader from "./ExploreHeader";
import ExploreMap from "./ExploreMap";
import ExploreSection from "./ExploreSection";
import { getCachedResults, setCachedResults } from "./exploreCache";
import { buildExplorePayload, hasActiveFilters } from "./filterConfig";
import useBrowserLocation from "./useBrowserLocation";
import useExploreState from "./useExploreState";
import useSpotlightShops from "./useSpotlightShops";
import useAdminTheme from "../admin/useAdminTheme";
import useSearchLocation from "./useSearchLocation";
import { useAuth } from "../../context/AuthContext";
import "./consumerExplore.css";

const ConsumerExplore = ({ embedded = false, themeOverride, showSpotlight }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedLicense = searchParams.get("license")?.trim() || "";
  const requestedLocation = searchParams.get("location")?.trim() || "";
  const scrollRestored = useRef(false);
  const { user } = useAuth();
  const canViewSpotlight = !requestedLicense && (showSpotlight ?? ["starter", "pro"].includes(user?.plan_tier));
  const { theme, toggleTheme } = useAdminTheme();
  const activeTheme = themeOverride || theme;
  const [shops, setShops] = useState(() => requestedLicense ? [] : getCachedResults("all") || []);
  const [loading, setLoading] = useState(() => requestedLicense ? true : !getCachedResults("all"));
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [mapLimit, setMapLimit] = useState(50);
  const { filters, setFilters, query, setQuery, view, setView, sort, setSort } = useExploreState();
  const { coords, locating, locationError } = useBrowserLocation();
  const { location: activeSearchLocation, resolving } = useSearchLocation(query);
  const { spotlightShops, spotlightLoading } = useSpotlightShops(filters, sort, coords, canViewSpotlight, query, activeSearchLocation, resolving);

  const openShop = useCallback((shop) => {
    const businessId = shop._id || shop.place_id || shop.id || "selected";
    sessionStorage.setItem("consumerExploreScrollY", String(window.scrollY));
    sessionStorage.setItem("selectedBusiness", JSON.stringify(shop));
    navigate(`/business/${encodeURIComponent(businessId)}`, { state: { business: shop } });
  }, [navigate]);

  useEffect(() => {
    if (scrollRestored.current || loading || view !== "list") return;
    scrollRestored.current = true;
    const savedScrollY = Number(sessionStorage.getItem("consumerExploreScrollY"));
    sessionStorage.removeItem("consumerExploreScrollY");
    if (!Number.isFinite(savedScrollY) || savedScrollY <= 0) return;
    requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo({ top: savedScrollY, behavior: "instant" })));
  }, [loading, shops.length, view]);

  useEffect(() => {
    if (!canViewSpotlight && filters.spotlight) {
      setFilters((current) => ({ ...current, spotlight: false }));
    }
  }, [canViewSpotlight, filters.spotlight, setFilters]);

  const effectiveFilters = useMemo(() => activeSearchLocation ? { ...filters, region: activeSearchLocation.country, searchType: "state_city", state: activeSearchLocation.state, city: activeSearchLocation.city, zipCode: "" } : filters, [filters, activeSearchLocation]);
  const hasSelectedLocation = Boolean(filters.region || filters.zipCode || filters.state || activeSearchLocation);
  const mapCoords = hasSelectedLocation ? null : coords;

  useEffect(() => setMapLimit(50), [filters]);

  useEffect(() => {
    if (!requestedLicense && (resolving || (query.trim() && !activeSearchLocation && locating))) return;
    let cancelled = false;
    const payload = buildExplorePayload(filters, sort, coords, query, activeSearchLocation);
    if (requestedLicense) {
      payload.licenseNumber = requestedLicense;
      if (requestedLocation) payload.location = requestedLocation;
    }
    if (view === "map") payload.limit = mapLimit;
    const hasFilterLocation = filters.region || filters.zipCode || filters.state || activeSearchLocation;
    if (!requestedLicense && !hasFilterLocation && !coords) {
      setShops([]);
      setLoading(locating);
      return;
    }
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
        if (cancelled) return;
        const nextShops = result?.data?.shops || [];
        setCachedResults("all", requestKey, nextShops);
        setShops(nextShops);
      })
      .catch(() => !cancelled && setShops([]))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [coords, filters, locating, sort, activeSearchLocation, view, mapLimit, requestedLicense, requestedLocation, query, resolving]);

  const visibleShops = useMemo(() => {
    const filtered = shops.filter((shop) => {
      return (!canViewSpotlight || shop.featured !== true);
    });
    return [...filtered].sort((a, b) => {
      const featuredOrder = Number(b.featured === true) - Number(a.featured === true);
      if (featuredOrder) return featuredOrder;
      return sort === "rating"
        ? (b.rating || 0) - (a.rating || 0)
        : sort === "alphabetical" ? (a.name || "").localeCompare(b.name || "") : 0;
    });
  }, [shops, sort, canViewSpotlight]);

  return (
    <div className={embedded ? "consumer-theme" : `admin-theme operator-theme admin-theme--${theme}`}>
      <main className="consumer-explore">
        <div className="consumer-shell">
        <ExploreHeader view={view} onViewChange={setView} theme={activeTheme} onThemeToggle={toggleTheme} />
        <ExploreControls query={query} onQueryChange={setQuery} filtersOpen={filtersOpen || hasActiveFilters(filters)} onFiltersToggle={() => setFiltersOpen(true)} sort={sort} onSortChange={setSort} />
        {filtersOpen && <ExploreFilterPanel value={effectiveFilters} showSpotlight={canViewSpotlight} onClose={() => setFiltersOpen(false)} onApply={(nextFilters) => { if (["region", "searchType", "state", "city", "zipCode"].some(key => nextFilters[key] !== effectiveFilters[key])) setQuery(""); setFilters(nextFilters); setFiltersOpen(false); }} />}
        {view === "map" ? <ExploreMap shops={visibleShops} coords={mapCoords} locating={!hasSelectedLocation && locating} locationError={hasSelectedLocation ? "" : locationError} onShopSelect={openShop} theme={activeTheme} canLoadMore={shops.length >= mapLimit && mapLimit < 1000} nextLimit={Math.min(mapLimit + 50, 1000)} onLoadMore={() => setMapLimit(limit => Math.min(limit + 50, 1000))} /> : <>
          {canViewSpotlight && <ExploreSection title="Spotlight" shops={spotlightShops} spotlight emptyText={filters.region || filters.zipCode || filters.state ? "No spotlight operators match this location." : locationError || "No spotlight operators yet."} loading={resolving || spotlightLoading || (!hasSelectedLocation && locating)} />}
          <ExploreSection
            title="All"
            shops={visibleShops.slice(0, 6)}
            emptyText={requestedLicense ? "No exact or close license match was found." : (!hasSelectedLocation && locationError) || "No operators found near this location."}
            loading={loading || resolving}
            onSeeAll={() => navigate("/explore/all", { state: { filters, sort, query, searchLocation: activeSearchLocation, coords, showSpotlight: canViewSpotlight } })}
          />
        </>}
        </div>
      </main>
    </div>
  );
};

export default ConsumerExplore;
