"use client";

// Direct mirror of useHomzProjects.ts, for the individual-listing segments
// (Sale/Rent/Pg/Commercial) instead of the Projects catalogue. Same
// loading/error/retry contract so PropertyListingPage can reuse the same
// rendering patterns as app/project-listing/page.tsx.

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchProperties, type RawHomzProperty } from "@/lib/scraping/homzbackend";
import { isAbortError } from "@/lib/scraping/http";

export type HomzPropertySource = {
  /** Catalogue segment, e.g. "ggnRentProperties" (see propertySegment). */
  segment: string;
  limit?: number;
  page?: number;
};

type HomzPropertiesState = {
  /** One array per source, index-aligned with the `sources` argument.
   *  A failed source yields [] so one flaky endpoint never blanks a section. */
  data: RawHomzProperty[][];
  loading: boolean;
  /** Set only when every source failed — partial data renders without error. */
  error: string | null;
  failedCount: number;
};

const FRIENDLY_ERROR =
  "We couldn't load listings right now. Please check your connection and try again.";

export function useHomzProperties(sources: HomzPropertySource[]) {
  // Consumers pass module-level constants, but serializing keeps the effect
  // correct even for inline arrays without refetching on referential churn.
  const key = JSON.stringify(sources);
  const [attempt, setAttempt] = useState(0);
  const forceRef = useRef(false);
  const [state, setState] = useState<HomzPropertiesState>({
    data: [],
    loading: true,
    error: null,
    failedCount: 0,
  });

  useEffect(() => {
    const parsed: HomzPropertySource[] = JSON.parse(key);
    const controller = new AbortController();
    const force = forceRef.current;
    forceRef.current = false;

    setState((s) => ({ ...s, loading: true, error: null }));

    (async () => {
      // Each source settles independently — Promise.all would fail fast on the
      // first rejection and blank the section even when the others succeeded.
      const settled = await Promise.all(
        parsed.map((src) =>
          fetchProperties(src.segment, {
            limit: src.limit,
            page: src.page,
            signal: controller.signal,
            force,
          })
            .then((data) => ({ ok: true as const, data }))
            .catch((err) => ({ ok: false as const, err }))
        )
      );

      if (controller.signal.aborted) return;
      if (settled.some((r) => !r.ok && isAbortError(r.err))) return;

      const failedCount = settled.filter((r) => !r.ok).length;
      if (settled.length > 0 && failedCount === settled.length) {
        setState({ data: [], loading: false, error: FRIENDLY_ERROR, failedCount });
      } else {
        setState({
          data: settled.map((r) => (r.ok ? r.data : [])),
          loading: false,
          error: null,
          failedCount,
        });
      }
    })();

    return () => controller.abort();
  }, [key, attempt]);

  const retry = useCallback(() => {
    forceRef.current = true;
    setAttempt((a) => a + 1);
  }, []);

  return { ...state, retry };
}
