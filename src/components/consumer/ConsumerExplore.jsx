import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { searchShops } from "../../services/api";
import ExploreControls from "./ExploreControls";
import ExploreFilterPanel from "./ExploreFilterPanel";
import ExploreHeader from "./ExploreHeader";
import ExploreSection from "./ExploreSection";
import { buildSearchPayload, EMPTY_FILTERS, hasActiveFilters } from "./filterConfig";
import "./consumerExplore.css";

const getCoordinates = () => ({
  lat: Number(localStorage.getItem("userLatitude")),
  lng: Number(localStorage.getItem("userLongitude")),
});

const ConsumerExplore = () => {
  const navigate = useNavigate();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [view, setView] = useState("list");
  const [sort, setSort] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({ ...EMPTY_FILTERS });

  useEffect(() => {
    const { lat, lng } = getCoordinates();
    const payload = buildSearchPayload(filters, sort);
    const hasFilterLocation = filters.region || filters.zipCode || filters.state;
    if (!hasFilterLocation && lat && lng) Object.assign(payload, { lat, lng });
    else if (!hasFilterLocation) {
      delete payload.radius;
      Object.assign(payload, { country: "US" });
    }
    setLoading(true);
    searchShops(payload)
      .then((result) => setShops(result?.data?.shops || []))
      .catch(() => setShops([]))
      .finally(() => setLoading(false));
  }, [filters, sort]);

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

  const spotlight = visibleShops.filter((shop) => shop.featured || shop.spotlight).slice(0, 5);

  return (
    <main className="consumer-explore">
      <div className="consumer-shell">
        <ExploreHeader view={view} onViewChange={setView} />
        <ExploreControls query={query} onQueryChange={setQuery} filtersOpen={filtersOpen || hasActiveFilters(filters)} onFiltersToggle={() => setFiltersOpen(true)} sort={sort} onSortChange={setSort} />
        {filtersOpen && <ExploreFilterPanel value={filters} onClose={() => setFiltersOpen(false)} onApply={(nextFilters) => { setFilters(nextFilters); setFiltersOpen(false); }} />}
        {view === "map" ? <div className="consumer-map"><span>⌖</span><p>Map results</p><small>{visibleShops.length} operators in this area</small></div> : <>
          <ExploreSection title="Spotlight" shops={spotlight} spotlight emptyText="No spotlight operators yet." loading={loading} />
          <ExploreSection
            title="All"
            shops={visibleShops.slice(0, 6)}
            emptyText="No operators found near this location."
            loading={loading}
            onSeeAll={() => navigate("/explore/all", { state: { filters, sort, query } })}
          />
        </>}
      </div>
    </main>
  );
};

export default ConsumerExplore;
