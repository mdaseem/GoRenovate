import { useEffect, useState } from "react";
import axios from "axios";
import { Vendor } from "../VendorPage/vendor";

const MIN_QUERY_LENGTH = 2;
const SUGGESTION_LIMIT = 6;

interface UseSearchSuggestionsReturn {
  suggestions: Vendor[];
  isLoading: boolean;
  error: string | null;
}

// `query` should already be debounced by the caller (see useDebouncedValue) —
// this hook only owns the network request itself: firing it, aborting the
// previous one on every change so a slow, now-stale response can't overwrite
// a newer one, and cleaning up on unmount.
export function useSearchSuggestions(
  query: string,
  token?: string,
): UseSearchSuggestionsReturn {
  const [suggestions, setSuggestions] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = query.trim();

  useEffect(() => {
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    axios
      .get<Vendor[]>(`${process.env.NEXT_PUBLIC_EXPRESS_API_URL}/vendors`, {
        params: { search: trimmed, limit: SUGGESTION_LIMIT },
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        signal: controller.signal,
      })
      .then((response) => {
        setSuggestions(response.data);
        setIsLoading(false);
      })
      .catch((err) => {
        if (axios.isCancel(err)) return;
        setError("Couldn't load suggestions.");
        setIsLoading(false);
      });

    return () => controller.abort();
  }, [trimmed, token]);

  return { suggestions, isLoading, error };
}
