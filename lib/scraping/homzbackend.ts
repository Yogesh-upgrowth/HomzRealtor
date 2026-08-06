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

// Same repo as the scraper/exporter now (see docs/listings-feed-contract.md
// in Homz-Scrape) — homzbackend.vercel.app was a separate, driftable project
// that had gone stale; this points at the deployment that's actually kept in
// sync with the warehouse.
export const HOMZBACKEND_BASE = "https://homz-scrape.vercel.app/api/data";

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

/** Sale pools sale/resale/new_launch/project; Commercial is listing_type
 *  "commercial" exactly — see docs/listings-feed-contract.md for why. */
export type PropertyCategory = "Sale" | "Rent" | "Pg" | "Commercial";

/** Individual-listing record shape — flatter than RawHomzProject (one
 *  price/area/config, not a priceList/flats breakdown), and carries raw
 *  numeric fields for client-side filtering rather than display strings only. */
export type RawHomzProperty = {
  /** Stable natural key ("source:source_id"), e.g. "magicbricks:4d4238...".
   *  Individual listings don't have unique titles the way projects do, so
   *  detail-page slugs must incorporate this rather than just the title. */
  id?: string;
  title?: string;
  location?: string;
  price?: string;
  priceValue?: number | null;
  rentMonthly?: number | null;
  size?: string;
  areaValue?: number | null;
  configuration?: string;
  bedrooms?: number | null;
  /** apartment | builder_floor | independent_house | villa | plot | penthouse |
   *  studio | office | retail_shop | showroom | warehouse | co_working |
   *  farmhouse | serviced_apartment | other */
  propertyType?: string;
  /** sale | resale | new_launch | project | rent | pg | commercial — the
   *  Resale-vs-New-Launch sub-filter within the Sale category reads this. */
  listingType?: string;
  isCommercial?: boolean;
  reraId?: string;
  projectStatus?: string;
  possession?: string;
  builderDescription?: string;
  aboutProject?: string[];
  amenities?: { category: string; amenities: string[] }[];
  specifications?: { heading: string; value: string }[];
  images?: string[];
  interiorImages?: string[];
  masterPlan?: Record<string, string>;
  landmarks?: Record<string, { name: string; distance: string }[]>;
  listingUrl?: string;
  updatedAt?: string;
  /** 0-100, from the backend's real enrichment pipeline (homz enrich
   *  scores) — not a client-side heuristic. Null until enrichment has run. */
  investmentScore?: number | null;
  riskScore?: number | null;
  locationScore?: number | null;
  /** One-time LLM-generated summary (homz enrich property-summaries), not a
   *  live per-page-load call. Null until that enrichment tier has run. */
  aiSummary?: string | null;
  [key: string]: unknown;
};

type DataResponse<T> = { results?: T[] };

/** e.g. ("ggn", "Residential") -> "ggnResidentialProjects" */
export function categorySegment(cityKey: string, category: ProjectCategory): string {
  return `${cityKey}${category}Projects`;
}

/** e.g. ("ggn", "Rent") -> "ggnRentProperties" */
export function propertySegment(cityKey: string, category: PropertyCategory): string {
  return `${cityKey}${category}Properties`;
}

export function homzDataUrl(citySegment: string, page = 1, limit = 500): string {
  return `${HOMZBACKEND_BASE}?city=${citySegment}&page=${page}&limit=${limit}`;
}

// ── Browser cache ────────────────────────────────────────────────────────────

const CACHE_TTL_MS = 30 * 60 * 1000;
const STORAGE_PREFIX = "homz:v1:";

type CacheEntry<T> = { expires: number; data: T[] };

// Keyed by URL, shared across both Projects and Properties fetches — the
// value type varies per entry but each URL only ever holds one shape, so a
// single untyped map (cast at the read/write sites below) is fine here.
const memoryCache = new Map<string, CacheEntry<unknown>>();
const inFlight = new Map<string, Promise<unknown[]>>();

function readSession<T>(url: string): CacheEntry<T> | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_PREFIX + url);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (!Array.isArray(entry.data) || entry.expires <= Date.now()) return null;
    return entry;
  } catch {
    return null;
  }
}

function writeSession<T>(url: string, entry: CacheEntry<T>): void {
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

async function fetchSegment<T>(
  citySegment: string,
  opts: FetchProjectsOptions
): Promise<T[]> {
  const url = homzDataUrl(citySegment, opts.page ?? 1, opts.limit ?? 500);
  const isBrowser = typeof window !== "undefined";

  if (!isBrowser) {
    // Server callers manage their own caching (unstable_cache / next revalidate).
    const data = await fetchJson<DataResponse<T>>(url, { signal: opts.signal });
    return Array.isArray(data?.results) ? data.results : [];
  }

  if (!opts.force) {
    const hit = memoryCache.get(url) as CacheEntry<T> | undefined;
    if (hit && hit.expires > Date.now()) return hit.data;

    const stored = readSession<T>(url);
    if (stored) {
      memoryCache.set(url, stored);
      return stored.data;
    }

    const pending = inFlight.get(url) as Promise<T[]> | undefined;
    if (pending) return abortable(pending, opts.signal);
  }

  const request = fetchJson<DataResponse<T>>(url)
    .then((data) => {
      const results = Array.isArray(data?.results) ? data.results : [];
      const entry: CacheEntry<T> = { expires: Date.now() + CACHE_TTL_MS, data: results };
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

/** Fetch one Projects catalogue segment (e.g. "ggnResidentialProjects"), cached in the browser. */
export function fetchProjects(
  citySegment: string,
  opts: FetchProjectsOptions = {}
): Promise<RawHomzProject[]> {
  return fetchSegment<RawHomzProject>(citySegment, opts);
}

/** Fetch one individual-listings segment (e.g. "ggnRentProperties"), cached in the browser. */
export function fetchProperties(
  citySegment: string,
  opts: FetchProjectsOptions = {}
): Promise<RawHomzProperty[]> {
  return fetchSegment<RawHomzProperty>(citySegment, opts);
}
