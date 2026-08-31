import { REGION_LABELS } from "./filterConfig";
import MaterialIcon from "./MaterialIcon";

const FilterLocation = ({ draft, setField }) => (
  <>
    <section className="filter-block">
      <div className="filter-block__heading"><strong>Distance</strong><span>{draft.radius} mi</span></div>
      <input type="range" min="1" max="100" value={draft.radius} onChange={(event) => setField("radius", Number(event.target.value))} />
      <div className="range-labels"><small>1</small><small>100</small></div>
    </section>
    <section className="filter-block">
      <strong>Region</strong>
      <div className="region-grid">
        {Object.entries(REGION_LABELS).map(([code, label]) => (
          <button key={code} className={draft.region === code ? "active" : ""} onClick={() => setField("region", draft.region === code ? "" : code)}>{label}</button>
        ))}
      </div>
    </section>
    <section className="filter-block">
      <strong>Search By</strong>
      <div className="search-type-grid">
        <button className={draft.searchType === "zip" ? "active" : ""} onClick={() => setField("searchType", "zip")}><MaterialIcon name="location-pin" size={18} /> Zip Code</button>
        <button className={draft.searchType === "state_city" ? "active" : ""} onClick={() => setField("searchType", "state_city")}><MaterialIcon name="map" size={18} /> State & City</button>
      </div>
      {!draft.region && <div className="filter-helper"><MaterialIcon name="info-outline" size={16} color="#f5a623" /><span>Please select a region above before searching.</span></div>}
      {draft.searchType === "zip" ? (
        <label className="filter-field">Zip Code<div className="filter-input"><MaterialIcon name="search" color="#999" /><input value={draft.zipCode} onChange={(event) => setField("zipCode", event.target.value)} placeholder="Search by zip code…" /></div></label>
      ) : (
        <div className="filter-field-grid">
          <label className="filter-field">State<div className="filter-input"><MaterialIcon name="search" color="#999" /><input value={draft.state} onChange={(event) => setField("state", event.target.value)} placeholder="State or province" /></div></label>
          <label className="filter-field">City <small>(optional)</small><div className="filter-input"><MaterialIcon name="search" color="#999" /><input value={draft.city} onChange={(event) => setField("city", event.target.value)} placeholder="City" /></div></label>
        </div>
      )}
    </section>
  </>
);

export default FilterLocation;
