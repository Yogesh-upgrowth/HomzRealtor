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

import { SITEMAP_SEGMENT_IDS } from "../lib/seo/sitemapSegments.ts";

const CANONICAL_ORIGIN = "https://www.homzrealtor.com";
const BASE_URL = process.argv[2] || CANONICAL_ORIGIN;
const MAX_URLS = process.argv[3] ? parseInt(process.argv[3], 10) : Infinity;

// 2026-09-22. This was a hardcoded list of seven, which had gone stale: the
// 'comparisons' segment shipped the same day and was never reconciled here, so
// the one segment whose indexation nobody had seen before was also the one
// segment this script did not check.
//
// lib/seo/sitemapSegments.ts exists precisely because two hand-maintained
// copies of this list had already drifted once. This was a third copy. It now
// reads the same constant app/sitemap.ts and the <sitemapindex> read, so a new
// segment is checked the moment it is declared.
const SEGMENTS = [...SITEMAP_SEGMENT_IDS];

const CONCURRENCY = 8;
const RETRIES = 2;
const TIMEOUT_MS = 15_000;

// Google's hard limits per sitemap file: 50,000 URLs or 50MB uncompressed.
// app/sitemap.ts declines to split the large segments further and says the
// check here "will say so before Google does" if one approaches the limit.
// That was not true — this script counted URLs per segment and never compared
// the count to anything. It is true now.
//
// The warning fires at 40,000 rather than 50,000 so there is room to split
// deliberately (buy-1.xml, buy-2.xml) rather than after Google has started
// rejecting a file.
const URL_LIMIT = 50_000;
const URL_WARN_AT = 40_000;
const BYTES_LIMIT = 50 * 1024 * 1024;
const BYTES_WARN_AT = 40 * 1024 * 1024;

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
  const perSegmentBytes = {};

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
      perSegmentBytes[seg] = Buffer.byteLength(xml, "utf8");
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

  // A segment that was never fetched is not a segment with no URLs. Declared
  // but absent means the <sitemapindex> points Google at a file that is not
  // there, which is worth more attention than a size warning.
  const missing = SEGMENTS.filter((s) => !(s in perSegmentCounts));
  if (missing.length) {
    console.log(`DECLARED BUT NOT SERVED (${missing.length}): ${missing.join(", ")}`);
    console.log(`  /sitemap.xml lists these; Google will fetch them and find nothing.\n`);
  }

  // Per-file size against Google's limits, reported every run rather than only
  // on breach — the useful thing is watching the largest segment's headroom
  // shrink, not being told once it has gone.
  console.log("Per-file size against Google's 50,000-URL / 50MB limits:");
  const sized = Object.entries(perSegmentCounts).sort((a, b) => b[1] - a[1]);
  let sizeProblem = false;
  for (const [seg, n] of sized) {
    const bytes = perSegmentBytes[seg] ?? 0;
    const mb = (bytes / 1024 / 1024).toFixed(1);
    const headroom = Math.round((1 - n / URL_LIMIT) * 100);
    let flag = "  ";
    if (n > URL_LIMIT || bytes > BYTES_LIMIT) {
      flag = "!!";
      sizeProblem = true;
    } else if (n >= URL_WARN_AT || bytes >= BYTES_WARN_AT) {
      flag = " !";
      sizeProblem = true;
    }
    console.log(
      `${flag} ${seg.padEnd(12)} ${String(n).padStart(6)} URLs  ${mb.padStart(5)} MB  ${headroom}% headroom`
    );
  }
  if (sizeProblem) {
    console.log(
      `\n  A flagged segment needs splitting into numbered files (e.g. buy-1.xml,\n` +
        `  buy-2.xml) in app/sitemap.ts, and the new ids adding to\n` +
        `  lib/seo/sitemapSegments.ts so the index and this check pick them up.`
    );
  }
  console.log("");

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
