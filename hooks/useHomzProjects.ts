"use client";

// Fetches one or more homzbackend catalogue segments from the browser with
// loading/error state, per-source failure tolerance, cancellation on unmount
// and a cache-busting retry. All consumers share the module-level cache in
// lib/scraping/homzbackend.ts, so e.g. the homepage's featured section and the
// listing page reuse the same response instead of refetching.

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchProjects, type RawHomzProject } from "@/lib/scraping/homzbackend";
import { isAbortError } from "@/lib/scraping/http";

export type HomzSource = {
  /** Catalogue segment, e.g. "ggnResidentialProjects" (see categorySegment). */
  segment: string;
  limit?: number;
  page?: number;
};

type HomzProjectsState = {
  /** One array per source, index-aligned with the `sources` argument.
   *  A failed source yields [] so one flaky endpoint never blanks a section. */
  data: RawHomzProject[][];
  loading: boolean;
  /** Set only when every source failed — partial data renders without error. */
  error: string | null;
  failedCount: number;
};

const FRIENDLY_ERROR =
  "We couldn't load projects right now. Please check your connection and try again.";

export function useHomzProjects(sources: HomzSource[]) {
  // Consumers pass module-level constants, but serializing keeps the effect
  // correct even for inline arrays without refetching on referential churn.
  const key = JSON.stringify(sources);
  const [attempt, setAttempt] = useState(0);
  const forceRef = useRef(false);
  const [state, setState] = useState<HomzProjectsState>({
    data: [],
    loading: true,
    error: null,
    failedCount: 0,
  });

  useEffect(() => {
    const parsed: HomzSource[] = JSON.parse(key);
    const controller = new AbortController();
    const force = forceRef.current;
    forceRef.current = false;

    setState((s) => ({ ...s, loading: true, error: null }));

    (async () => {
      // Each source settles independently — Promise.all would fail fast on the
      // first rejection and blank the section even when the others succeeded.
      const settled = await Promise.all(
        parsed.map((src) =>
          fetchProjects(src.segment, {
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
