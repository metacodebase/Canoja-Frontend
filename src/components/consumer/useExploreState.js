import { useEffect, useState } from "react";
import { EMPTY_FILTERS } from "./filterConfig";

const STORAGE_KEY = "consumerExploreState";

const loadExploreState = () => {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY));
    return {
      filters: { ...EMPTY_FILTERS, ...saved?.filters },
      query: saved?.query || "",
      view: saved?.view || "list",
      sort: saved?.sort || "",
    };
  } catch {
    return { filters: { ...EMPTY_FILTERS }, query: "", view: "list", sort: "" };
  }
};

const useExploreState = () => {
  const [state, setState] = useState(loadExploreState);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const setter = (key) => (value) => setState((current) => ({
    ...current,
    [key]: typeof value === "function" ? value(current[key]) : value,
  }));

  return {
    ...state,
    setFilters: setter("filters"),
    setQuery: setter("query"),
    setView: setter("view"),
    setSort: setter("sort"),
  };
};

export default useExploreState;
