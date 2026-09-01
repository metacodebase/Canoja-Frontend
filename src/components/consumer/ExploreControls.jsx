import { Search } from "lucide-react";
import { SlidersVertical } from "lucide-react";
import MaterialIcon from "./MaterialIcon";

const ExploreControls = ({ query, onQueryChange, filtersOpen, onFiltersToggle, sort, onSortChange }) => (
  <div className="explore-controls">
    <label className="consumer-search">
      <Search aria-hidden="true" size={16} strokeWidth={2} />
      <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Search" />
    </label>
    <div className="explore-actions">
      <button className={`explore-icon-button${filtersOpen ? " active" : ""}`} onClick={onFiltersToggle} aria-label="Filters"><SlidersVertical size={20} /></button>
      <label className="sort-control">
        <MaterialIcon name="sort" size={22} />
        <select value={sort} onChange={(event) => onSortChange(event.target.value)} aria-label="Sort results">
          <option value="">Sort</option>
          <option value="rating">Top rated</option>
          <option value="alphabetical">A–Z</option>
        </select>
      </label>
    </div>
  </div>
);

export default ExploreControls;
