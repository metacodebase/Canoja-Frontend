import { Search } from "lucide-react";

const ExploreControls = ({ query, onQueryChange, filtersOpen, onFiltersToggle, sort, onSortChange }) => (
  <div className="explore-controls">
    <label className="consumer-search">
      <Search aria-hidden="true" size={16} strokeWidth={2} />
      <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Search" />
    </label>
    <button className={filtersOpen ? "active" : ""} onClick={onFiltersToggle} aria-label="Filters">☷</button>
    <select value={sort} onChange={(event) => onSortChange(event.target.value)} aria-label="Sort results">
      <option value="">Sort</option>
      <option value="rating">Top rated</option>
      <option value="alphabetical">A–Z</option>
    </select>
  </div>
);

export default ExploreControls;
