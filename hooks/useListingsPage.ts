"use client";

// Fetches one page of a Properties segment through /api/listings, with the
// filtering already applied server-side. Replaces the old useHomzProperties
// hook + PropertyListingPage's client-side useMemo filter pipeline — same
// loading/error/retry contract as useHomzProjects so PropertyListingPage's
// render logic barely changes.

import { useCallback, useEffect, useRef, useState } from "react";
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

/** Server-fetched data for one specific (segment, category, filters, page,
 *  limit) combination — `key` must be built the same way this hook builds
 *  its own `key` below, so the hook can tell whether the seeded data still
 *  matches what's actually being requested (it stops matching the moment
 *  any filter/page/limit changes, e.g. cardsPerPage flipping once the real
 *  viewport is detected). DEV-04 (2026-09-16): this is what lets the
 *  default (no filters, page 1) view render real listing cards in the
 *  initial server-rendered HTML — the same HTML a crawler sees — instead
 *  of an empty shell that only fills in after a client fetch. */
export type InitialListingsData = {
  key: string;
  results: RawHomzProperty[];
  total: number;
  facets: ListingFacets;
};

export function useListingsPage(
  segment: string,
  category: PropertyCategory,
  filters: ListingFilters,
  page: number,
  limit: number,
  initial?: InitialListingsData
) {
  // Filters/page/limit are plain values from URL search params + local state
  // at every call site — serializing keeps the effect correct without
  // requiring every caller to memoize its filters object.
  const key = JSON.stringify({ segment, category, filters, page, limit });
  const [attempt, setAttempt] = useState(0);
  // Only the very first effect run may skip its fetch (when seeded data
  // still matches `key`) — any later render reaching this same key again
  // (e.g. the user clears filters back to default) fetches fresh, same as
  // every other transition.
  const skippedInitialFetch = useRef(false);

  const [state, setState] = useState<State>(() =>
    initial && initial.key === key
      ? { results: initial.results, total: initial.total, facets: initial.facets, loading: false, error: null }
      : { results: [], total: 0, facets: EMPTY_FACETS, loading: true, error: null }
  );

  useEffect(() => {
    if (!skippedInitialFetch.current) {
      skippedInitialFetch.current = true;
      if (initial && initial.key === key) return;
    }

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
