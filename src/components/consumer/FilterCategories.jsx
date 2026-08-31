import MaterialIcon from "./MaterialIcon";

const FILTERS = [
  ["openNow", "Open Now"],
  ["canojaVerified", "Canoja Verified"],
  ["cannabis", "Cannabis"],
  ["smokeShops", "Smoke Shop"],
  ["hasMenu", "Active Menu"],
  ["spotlight", "Spotlight"],
];

const FilterCategories = ({ draft, setDraft }) => {
  const toggle = (key) => setDraft((current) => ({
    ...current,
    [key]: !current[key],
    ...(key === "cannabis" && !current.cannabis ? { smokeShops: false } : {}),
    ...(key === "smokeShops" && !current.smokeShops ? { cannabis: false, medical: false, recreational: false } : {}),
  }));

  return (
    <section className="filter-block category-block">
      <strong>Business Filters</strong>
      {FILTERS.map(([key, label]) => (
        <div key={key}>
          <button className="filter-check" onClick={() => toggle(key)}>
            <span className={`mobile-checkbox${draft[key] ? " checked" : ""}`}>{draft[key] && <MaterialIcon name="check" size={16} color="#fff" />}</span>
            <span>{label}</span>
          </button>
          {key === "cannabis" && draft.cannabis && (
            <div className="cannabis-types">
              <button onClick={() => toggle("medical")}><span className={`mobile-checkbox${draft.medical ? " checked" : ""}`}>{draft.medical && <MaterialIcon name="check" size={16} color="#fff" />}</span>Medical</button>
              <button onClick={() => toggle("recreational")}><span className={`mobile-checkbox${draft.recreational ? " checked" : ""}`}>{draft.recreational && <MaterialIcon name="check" size={16} color="#fff" />}</span>Recreational</button>
            </div>
          )}
        </div>
      ))}
    </section>
  );
};

export default FilterCategories;
