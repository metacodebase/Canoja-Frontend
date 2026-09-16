import { useEffect, useState } from "react";
import { resolveLocationSearch } from "./locationSearch";

const useSearchLocation = (query, initialLocation = null) => {
  const [result, setResult] = useState(() => initialLocation ? { query, location: initialLocation } : null);
  useEffect(() => {
    if (initialLocation) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      const location = await resolveLocationSearch(query);
      if (!cancelled) setResult({ query, location });
    }, 400);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [query, initialLocation]);
  return { location: result?.query === query ? result.location : null, resolving: Boolean(query.trim()) && result?.query !== query };
};

export default useSearchLocation;
