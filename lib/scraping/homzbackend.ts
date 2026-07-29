// Typed client for the public homzbackend catalogue API — the single place
// that knows the API's URL shape and response format.
//
// The API is unauthenticated and serves `Access-Control-Allow-Origin: *`, so
// browsers may call it directly; no server proxy or secret is involved. This
// module is isomorphic: the URL builders are shared with the server-side
// fetchers (lib/intelligence/projects.ts, app/sitemap.ts — which keep Next's
// Data Cache semantics via `next: { revalidate }`), while the response cache
// below only engages in the browser.
//
// Browser caching strategy, mirroring the server's 1h revalidate window:
//  1. in-memory Map        — survives client-side navigations (module state)
//  2. sessionStorage       — survives hard reloads within a tab session
//  3. in-flight dedupe     — concurrent components share one network request

import { fetchJson } from "./http";

export const HOMZBACKEND_BASE = "https://homzbackend.vercel.app/api/data";

export const CITY_KEYS = ["ggn", "delhi", "faridabad", "gNoida", "noida"] as const;
export type CityKey = (typeof CITY_KEYS)[number];

export type ProjectCategory = "Commercial" | "Residential";

/** Raw record shape served by the API — the fields the app actually reads.
 *  Extra fields pass through untyped (records are spread into view objects). */
export type RawHomzProject = {
  projectTitle?: string;
  location?: string;
  price?: string;
  size?: string;
  BHKType?: string;
  reraId?: string;
  projectStatus?: string;
  possession?: string;
  aboutProject?: string[];
  images?: string[];
  priceList?: unknown[];
  amenities?: unknown[];
  updatedAt?: string;
  [key: string]: unknown;
};

type DataResponse = { results?: RawHomzProject[] };

/** e.g. ("ggn", "Residential") -> "ggnResidentialProjects" */
export function categorySegment(cityKey: string, category: ProjectCategory): string {
  return `${cityKey}${category}Projects`;
}

export function homzDataUrl(citySegment: string, page = 1, limit = 500): string {
  return `${HOMZBACKEND_BASE}?city=${citySegment}&page=${page}&limit=${limit}`;
}

// ── Browser cache ────────────────────────────────────────────────────────────

const CACHE_TTL_MS = 30 * 60 * 1000;
const STORAGE_PREFIX = "homz:v1:";

type CacheEntry = { expires: number; data: RawHomzProject[] };

const memoryCache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<RawHomzProject[]>>();

function readSession(url: string): CacheEntry | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_PREFIX + url);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry;
    if (!Array.isArray(entry.data) || entry.expires <= Date.now()) return null;
    return entry;
  } catch {
    return null;
  }
}

function writeSession(url: string, entry: CacheEntry): void {
  try {
    sessionStorage.setItem(STORAGE_PREFIX + url, JSON.stringify(entry));
  } catch {
    // Quota exceeded on large payloads — the in-memory layer still applies.
  }
}

// The shared network request runs detached from any one caller's signal, so an
// unmounting component doesn't cancel a fetch its siblings are awaiting (and a
// completed fetch still warms the cache). Each caller instead races the shared
// promise against its own signal, keeping cancellation prompt per consumer.
function abortable<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return promise;
  if (signal.aborted) {
    return Promise.reject(signal.reason ?? new DOMException("Aborted", "AbortError"));
  }
  return new Promise<T>((resolve, reject) => {
    const onAbort = () =>
      reject(signal.reason ?? new DOMException("Aborted", "AbortError"));
    signal.addEventListener("abort", onAbort, { once: true });
    promise.then(
      (value) => {
        signal.removeEventListener("abort", onAbort);
        resolve(value);
      },
      (err) => {
        signal.removeEventListener("abort", onAbort);
        reject(err);
      }
    );
  });
}

export type FetchProjectsOptions = {
  page?: number;
  limit?: number;
  signal?: AbortSignal;
  /** Skip caches and refetch (used by retry UIs). */
  force?: boolean;
};

/** Fetch one catalogue segment (e.g. "ggnResidentialProjects"), cached in the browser. */
export async function fetchProjects(
  citySegment: string,
  opts: FetchProjectsOptions = {}
): Promise<RawHomzProject[]> {
  const url = homzDataUrl(citySegment, opts.page ?? 1, opts.limit ?? 500);
  const isBrowser = typeof window !== "undefined";

  if (!isBrowser) {
    // Server callers manage their own caching (unstable_cache / next revalidate).
    const data = await fetchJson<DataResponse>(url, { signal: opts.signal });
    return Array.isArray(data?.results) ? data.results : [];
  }

  if (!opts.force) {
    const hit = memoryCache.get(url);
    if (hit && hit.expires > Date.now()) return hit.data;

    const stored = readSession(url);
    if (stored) {
      memoryCache.set(url, stored);
      return stored.data;
    }

    const pending = inFlight.get(url);
    if (pending) return abortable(pending, opts.signal);
  }

  const request = fetchJson<DataResponse>(url)
    .then((data) => {
      const results = Array.isArray(data?.results) ? data.results : [];
      const entry = { expires: Date.now() + CACHE_TTL_MS, data: results };
      memoryCache.set(url, entry);
      writeSession(url, entry);
      return results;
    })
    .finally(() => {
      // Only clear our own entry — a force-refresh may have replaced it with a
      // newer in-flight request that must keep deduping until it settles.
      if (inFlight.get(url) === request) inFlight.delete(url);
    });

  inFlight.set(url, request);
  return abortable(request, opts.signal);
}
