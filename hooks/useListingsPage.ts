"use client";

// Fetches one page of a Properties segment through /api/listings, with the
// filtering already applied server-side. Replaces the old useHomzProperties
// hook + PropertyListingPage's client-side useMemo filter pipeline — same
// loading/error/retry contract as useHomzProjects so PropertyListingPage's
// render logic barely changes.

import { useCallback, useEffect, useState } from "react";
import { fetchListingsPage } from "@/lib/listings/client";
import { isAbortError } from "@/lib/scraping/http";
import type { ListingFacets, ListingFilters, PropertyCategory } from "@/lib/listings/filters";
import type { RawHomzProperty } from "@/lib/scraping/homzbackend";

const FRIENDLY_ERROR =
  "We couldn't load listings right now. Please check your connection and try again.";

const EMPTY_FACETS: ListingFacets = { propertyTypes: [], bedrooms: [], rk: [] };

type State = {
  results: RawHomzProperty[];
  total: number;
  facets: ListingFacets;
  loading: boolean;
  error: string | null;
};

export function useListingsPage(
  segment: string,
  category: PropertyCategory,
  filters: ListingFilters,
  page: number,
  limit: number
) {
  // Filters/page/limit are plain values from URL search params + local state
  // at every call site — serializing keeps the effect correct without
  // requiring every caller to memoize its filters object.
  const key = JSON.stringify({ segment, category, filters, page, limit });
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<State>({
    results: [],
    total: 0,
    facets: EMPTY_FACETS,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));

    fetchListingsPage(segment, category, filters, page, limit, { signal: controller.signal })
      .then((data) => {
        if (controller.signal.aborted) return;
        setState({
          results: data.results,
          total: data.total,
          facets: data.facets,
          loading: false,
          error: null,
        });
      })
      .catch((err) => {
        if (isAbortError(err)) return;
        setState({ results: [], total: 0, facets: EMPTY_FACETS, loading: false, error: FRIENDLY_ERROR });
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt]);

  const retry = useCallback(() => setAttempt((a) => a + 1), []);

  return { ...state, retry };
}
