import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { searchShops } from "../../services/api";
import ExploreControls from "./ExploreControls";
import ExploreFilterPanel from "./ExploreFilterPanel";
import ExploreHeader from "./ExploreHeader";
import ExploreSection from "./ExploreSection";
import { buildSearchPayload, hasActiveFilters } from "./filterConfig";
import useBrowserLocation from "./useBrowserLocation";
import useExploreState from "./useExploreState";
import useSpotlightShops from "./useSpotlightShops";
import "./consumerExplore.css";

const ConsumerExplore = () => {
  const navigate = useNavigate();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { filters, setFilters, query, setQuery, view, setView, sort, setSort } = useExploreState();
  const { coords, locating, locationError } = useBrowserLocation();
  const { spotlightShops, spotlightLoading } = useSpotlightShops(filters, sort, coords);

  useEffect(() => {
    const payload = buildSearchPayload(filters, sort);
    const hasFilterLocation = filters.region || filters.zipCode || filters.state;
    if (!hasFilterLocation && !coords) {
      setShops([]);
      setLoading(locating);
      return;
    }
    if (!hasFilterLocation) Object.assign(payload, coords);
    setLoading(true);
    searchShops(payload)
      .then((result) => setShops(result?.data?.shops || []))
      .catch(() => setShops([]))
      .finally(() => setLoading(false));
  }, [coords, filters, locating, sort]);

  const visibleShops = useMemo(() => {
    const term = query.trim().toLowerCase();
    const filtered = shops.filter((shop) => {
      const matchesSearch = !term || `${shop.name} ${shop.address} ${shop.found_by_query}`.toLowerCase().includes(term);
      return matchesSearch;
    });
    return [...filtered].sort((a, b) => sort === "rating"
      ? (b.rating || 0) - (a.rating || 0)
      : sort === "alphabetical" ? (a.name || "").localeCompare(b.name || "") : 0);
  }, [query, shops, sort]);

  return (
    <main className="consumer-explore">
      <div className="consumer-shell">
        <ExploreHeader view={view} onViewChange={setView} />
        <ExploreControls query={query} onQueryChange={setQuery} filtersOpen={filtersOpen || hasActiveFilters(filters)} onFiltersToggle={() => setFiltersOpen(true)} sort={sort} onSortChange={setSort} />
        {filtersOpen && <ExploreFilterPanel value={filters} onClose={() => setFiltersOpen(false)} onApply={(nextFilters) => { setFilters(nextFilters); setFiltersOpen(false); }} />}
        {view === "map" ? <div className="consumer-map"><span>⌖</span><p>Map results</p><small>{visibleShops.length} operators in this area</small></div> : <>
          <ExploreSection title="Spotlight" shops={spotlightShops} spotlight emptyText={locationError || "No spotlight operators yet."} loading={spotlightLoading || locating} />
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
  );
};

export default ConsumerExplore;
