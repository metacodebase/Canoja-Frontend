import { useEffect, useState } from "react";
import FilterCategories from "./FilterCategories";
import FilterLocation from "./FilterLocation";
import { EMPTY_FILTERS } from "./filterConfig";
import MaterialIcon from "./MaterialIcon";

const ExploreFilterPanel = ({ value, onApply, onClose }) => {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  const setField = (key, fieldValue) => setDraft((current) => ({ ...current, [key]: fieldValue }));

  return (
    <div className="filter-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside className="filter-panel" aria-label="Explore filters">
        <header className="filter-panel__header">
          <div><h2>Filters</h2><p>Find the best results near you</p></div>
          <button onClick={onClose} aria-label="Close filters">×</button>
        </header>
        <div className="filter-panel__body">
          <FilterLocation draft={draft} setField={setField} />
          <FilterCategories draft={draft} setDraft={setDraft} />
        </div>
        <footer className="filter-panel__footer">
          <button className="filter-reset" onClick={() => setDraft({ ...EMPTY_FILTERS })}><MaterialIcon name="refresh" /> Reset</button>
          <button className="filter-apply" onClick={() => onApply(draft)}>Apply Filters <MaterialIcon name="check" color="#fff" /></button>
        </footer>
      </aside>
    </div>
  );
};

export default ExploreFilterPanel;
