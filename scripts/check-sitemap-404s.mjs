#!/usr/bin/env node
// DEV-01 reconciliation command — read-only. Fetches every generated
// sitemap segment, extracts every <loc>, and checks each one at safe
// concurrency with retries, reporting anything that isn't a clean 200 or a
// well-formed redirect. Skipped/rate-limited URLs are reported as
// "unverified", not silently dropped — see docs/seo/implementation-status.md.
//
// Usage: node scripts/check-sitemap-404s.mjs [baseUrl] [maxUrls]
//   baseUrl defaults to https://www.homzrealtor.com — pass a preview URL to
//   check before release, per DEV-12's release-gate requirement.
//   maxUrls optionally caps how many URLs are actually HEAD-checked (after
//   dedup/origin validation, which always run against everything) — for a
//   quick sanity pass; omit for a real full reconciliation run.

const CANONICAL_ORIGIN = "https://www.homzrealtor.com";
const BASE_URL = process.argv[2] || CANONICAL_ORIGIN;
const MAX_URLS = process.argv[3] ? parseInt(process.argv[3], 10) : Infinity;
const SEGMENTS = ["projects", "sectors", "developers", "buy", "rent", "commercial", "content"];
const CONCURRENCY = 8;
const RETRIES = 2;
const TIMEOUT_MS = 15_000;

async function fetchWithRetry(url, opts = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, { ...opts, signal: controller.signal, redirect: "manual" });
      clearTimeout(timer);
      return res;
    } catch (err) {
      clearTimeout(timer);
      lastErr = err;
      if (attempt < RETRIES) await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
  }
  throw lastErr;
}

function extractLocs(xml) {
  const matches = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)];
  return matches.map((m) => m[1].trim());
}

async function mapWithConcurrency(items, limit, fn) {
  const results = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

async function main() {
  console.log(`Reconciling sitemaps against ${BASE_URL}\n`);

  const allLocs = new Map(); // url -> segment
  const perSegmentCounts = {};

  for (const seg of SEGMENTS) {
    const url = `${BASE_URL}/sitemap/${seg}.xml`;
    try {
      const res = await fetchWithRetry(url);
      if (!res.ok) {
        console.log(`SEGMENT FETCH FAILED  ${seg}  HTTP ${res.status}  ${url}`);
        continue;
      }
      const xml = await res.text();
      const locs = extractLocs(xml);
      perSegmentCounts[seg] = locs.length;
      for (const loc of locs) {
        if (allLocs.has(loc)) {
          console.log(`DUPLICATE LOC  ${loc}  (in both "${allLocs.get(loc)}" and "${seg}")`);
        } else {
          allLocs.set(loc, seg);
        }
      }
    } catch (err) {
      console.log(`SEGMENT FETCH ERROR  ${seg}  ${err.message}`);
    }
  }

  console.log(`\nSegments fetched: ${Object.entries(perSegmentCounts).map(([s, n]) => `${s}=${n}`).join(", ")}`);
  console.log(`Total unique URLs: ${allLocs.size}\n`);

  // <loc> values are always the canonical production origin regardless of
  // which host we're fetching sitemap XML/pages from (BASE_URL can be a
  // preview deployment, per DEV-12's release-gate use case) — that's the
  // real invalid-origin check, not a comparison against BASE_URL.
  const invalidOrigin = [...allLocs.keys()].filter((u) => !u.startsWith(CANONICAL_ORIGIN));
  if (invalidOrigin.length) {
    console.log(`INVALID ORIGIN (${invalidOrigin.length}) — first 10:`);
    invalidOrigin.slice(0, 10).forEach((u) => console.log(`  ${u}`));
  }

  const urls = [...allLocs.keys()].slice(0, MAX_URLS);
  if (Number.isFinite(MAX_URLS)) console.log(`(capped to ${urls.length} of ${allLocs.size} URLs for this run)`);
  const outcomes = { 200: 0, redirect: 0, notFound: 0, error: 0, unverified: 0 };
  const problems = [];

  await mapWithConcurrency(urls, CONCURRENCY, async (canonicalUrl) => {
    // Swap the canonical origin for BASE_URL so a preview deployment's own
    // pages get checked, while the reported URL stays the real <loc>.
    const url = canonicalUrl.replace(CANONICAL_ORIGIN, BASE_URL);
    const segment = allLocs.get(canonicalUrl);
    try {
      const res = await fetchWithRetry(url, { method: "HEAD" });
      if (res.status === 200) {
        outcomes[200]++;
      } else if (res.status >= 300 && res.status < 400) {
        outcomes.redirect++;
        problems.push({ url: canonicalUrl, status: res.status, location: res.headers.get("location"), segment });
      } else if (res.status === 404 || res.status === 410) {
        outcomes.notFound++;
        problems.push({ url: canonicalUrl, status: res.status, segment });
      } else {
        outcomes.error++;
        problems.push({ url: canonicalUrl, status: res.status, segment });
      }
    } catch (err) {
      outcomes.unverified++;
      problems.push({ url: canonicalUrl, status: "UNVERIFIED", error: err.message, segment });
    }
  });

  console.log(`\nOutcomes: 200=${outcomes[200]}  redirect=${outcomes.redirect}  404/410=${outcomes.notFound}  other-error=${outcomes.error}  unverified=${outcomes.unverified}`);

  if (problems.length) {
    console.log(`\n--- ${problems.length} URL(s) needing a documented outcome (not all need to become 200) ---`);
    for (const p of problems) {
      console.log(`[${p.segment}] ${p.status}  ${p.url}${p.location ? `  -> ${p.location}` : ""}${p.error ? `  (${p.error})` : ""}`);
    }
  } else {
    console.log("\nNo redirects, 404s, 410s, other-errors, or unverified URLs found.");
  }
}

main().catch((err) => {
  console.error("Reconciliation run failed:", err);
  process.exit(1);
});
