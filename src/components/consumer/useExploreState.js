import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { EMPTY_FILTERS } from "./filterConfig";

const STORAGE_KEY = "consumerExploreState";

const loadExploreState = () => {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.has("location") || params.has("type") || params.has("radius")) {
      const radius = Number(params.get("radius") || 10);
      return {
        filters: { ...EMPTY_FILTERS, radius: Math.min(100, Math.max(1, radius || 10)), cannabis: params.get("type") === "cannabis", smokeShops: params.get("type") === "smoke" },
        query: params.get("license") ? "" : params.get("location") || "",
        view: "list", sort: "",
      };
    }
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
  const { search } = useLocation();
  useEffect(() => {
    if (search) setState(loadExploreState());
  }, [search]);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const update = useCallback((key, value) => setState((current) => ({
    ...current,
    [key]: typeof value === "function" ? value(current[key]) : value,
  })), []);
  const setFilters = useCallback(value => update("filters", value), [update]);
  const setQuery = useCallback(value => update("query", value), [update]);
  const setView = useCallback(value => update("view", value), [update]);
  const setSort = useCallback(value => update("sort", value), [update]);

  return {
    ...state,
    setFilters,
    setQuery,
    setView,
    setSort,
  };
};

export default useExploreState;
