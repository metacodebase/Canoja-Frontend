import { getCities, getStates } from "@mardillu/us-cities-utils";
import { REGION_LABELS } from "./filterConfig";
import MaterialIcon from "./MaterialIcon";

const US_STATES = getStates();
const REGION_STATES = {
  US: US_STATES.map(({ name }) => name),
  CA: ["Alberta", "British Columbia", "Manitoba", "New Brunswick", "Newfoundland and Labrador", "Northwest Territories", "Nova Scotia", "Nunavut", "Ontario", "Prince Edward Island", "Quebec", "Saskatchewan", "Yukon"],
  JM: ["Clarendon", "Hanover", "Kingston", "Manchester", "Portland", "Saint Andrew", "Saint Ann", "Saint Catherine", "Saint Elizabeth", "Saint James", "Saint Mary", "Saint Thomas", "Trelawny", "Westmoreland"],
  VI: ["Saint Croix", "Saint John", "Saint Thomas"],
};
const ALL_STATES = Object.values(REGION_STATES).flat();
const getCityOptions = (state) => {
  const stateAbbr = US_STATES.find(({ name }) => name.toLowerCase() === state.trim().toLowerCase())?.nameAbbr;
  return stateAbbr ? [...new Set(getCities(stateAbbr).map(({ name }) => name))].sort() : [];
};

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
          <label className="filter-field">State<div className="filter-input"><MaterialIcon name="search" color="#999" /><input list="explore-region-states" value={draft.state} onChange={(event) => { const state = event.target.value; setField("state", state); if (!draft.region) { const region = Object.entries(REGION_STATES).find(([, states]) => states.includes(state))?.[0]; if (region) setField("region", region); } }} placeholder="State or province" /><datalist id="explore-region-states">{(draft.region ? REGION_STATES[draft.region] : ALL_STATES).map(state => <option key={state} value={state} />)}</datalist></div></label>
          <label className="filter-field">City <small>(optional)</small><div className="filter-input"><MaterialIcon name="search" color="#999" /><input list="explore-state-cities" value={draft.city} onChange={(event) => setField("city", event.target.value)} placeholder="City" /><datalist id="explore-state-cities">{getCityOptions(draft.state).map(city => <option key={city} value={city} />)}</datalist></div></label>
        </div>
      )}
    </section>
  </>
);

export default FilterLocation;
