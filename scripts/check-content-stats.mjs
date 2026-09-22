#!/usr/bin/env node
// Checklist item 6: recalculate every data-driven editorial claim (2026-09-22).
//
// Usage: npm run check:content-stats
//        npm run check:content-stats -- --json
//        npm run check:content-stats -- --offline   (surfaces only, no feed)
//
// WHAT IT CHECKS. lib/content/catalogueStats.ts declares every figure the
// published content asserts, with a machine-executable query. This runs each
// query against the live catalogue and reports:
//
//   1. DRIFT       — the live value has moved away from what the prose states.
//   2. ORPHANED    — a declared figure appears in no file. Either the prose was
//                    corrected without updating the declaration, or the claim
//                    was never made and the declaration is speculative.
//   3. SURFACES    — every file:line carrying a drifted figure, so the edit is
//                    a list rather than a search.
//
// ONE KNOWN IMPRECISION, stated rather than hidden: surfaces are matched on
// the digits, so two different claims that happen to share a number are
// reported against both. "34" is the New Gurgaon sector count and also
// appears in "DLF ... 34 live projects on Golf Course Road". The report is a
// list of lines to read, not a list of lines to blind-replace, and a
// find-and-replace over it would corrupt the other claim.
//
// WHY IT RUNS THE REAL PIPELINE. The counts only mean anything if they are the
// counts the site renders. Rather than reimplementing normalization (which is
// how scripts/check-data-quality.mjs drifted from the module it mirrors), this
// copies the real .ts modules to a temp dir with their import specifiers
// rewritten and imports them — the same trick tests/*.test.mjs uses. A change
// to the correction rules in lib/ is therefore a change to what this measures.
//
// EXIT CODES. 0 = no drift. 1 = drift found (a published number is wrong).
// 2 = the feed was unreachable, so nothing was measured — deliberately NOT 0,
// because "I could not check" must never read as "everything is correct".

import { mkdtempSync, readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { pathToFileURL } from "node:url";

const args = new Set(process.argv.slice(2));
const asJson = args.has("--json");
const offline = args.has("--offline");

const BASE = process.env.HOMZ_FEED_BASE || "https://homz-scrape.vercel.app/api/data";
const CITY_KEY = "ggn";
const LIMIT = 25000;

// ── load the real modules ───────────────────────────────────────────────────

const dir = mkdtempSync(join(tmpdir(), "contentstats-"));
const copy = (src, dest, replacements = []) => {
  let text = readFileSync(src, "utf8");
  for (const [from, to] of replacements) text = text.replace(from, to);
  writeFileSync(join(dir, dest), text);
};

writeFileSync(join(dir, "homzbackend.ts"), "export type RawHomzProperty = Record<string, any>;\n");
copy("lib/intelligence/dataQuality.ts", "dataQuality.ts", [
  ['from "@/lib/scraping/homzbackend"', 'from "./homzbackend.ts"'],
]);
copy("lib/intelligence/normalize.ts", "normalize.ts", [['from "./dataQuality"', 'from "./dataQuality.ts"']]);
copy("lib/intelligence/projectDedupe.ts", "projectDedupe.ts", [
  ['from "./normalize"', 'from "./normalize.ts"'],
]);
copy("lib/intelligence/excludedProjects.ts", "excludedProjects.ts");
copy("lib/intelligence/projectStatus.ts", "projectStatus.ts");
copy("lib/content/catalogueStats.ts", "catalogueStats.ts");
copy("lib/content/developers.ts", "developers.ts", [
  ['from "@/lib/intelligence/normalize"', 'from "./normalize.ts"'],
]);

const load = (f) => import(pathToFileURL(join(dir, f)).href);
const { normalizeProject, slugify } = await load("normalize.ts");
const { sanitizeSegment } = await load("dataQuality.ts");
const { collapseDuplicateProjects } = await load("projectDedupe.ts");
const { isExcludedProject } = await load("excludedProjects.ts");
const { projectStatusKind } = await load("projectStatus.ts");
const { CATALOGUE_STATS, PROJECT_CORRIDORS, STATS_MEASURED_AT } = await load("catalogueStats.ts");
const { canonicalDeveloperByName, developerStatusFor, isInvalidDeveloperSlug } =
  await load("developers.ts");

// ── surfaces: where each figure is written ──────────────────────────────────

const CONTENT_ROOTS = ["lib/content", "app", "components"];
const TEXT_EXT = /\.(ts|tsx|mjs|md)$/;

function walk(root, out = []) {
  let entries;
  try {
    entries = readdirSync(root);
  } catch {
    return out;
  }
  for (const name of entries) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const full = join(root, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (TEXT_EXT.test(name)) out.push(full);
  }
  return out;
}

/**
 * Prose spans in a source file: the contents of every string literal.
 *
 * A bare number matched against raw source is almost all noise — searching for
 * "60" hits `slice(0, 60)`, a Tailwind `gap-60`, an opacity, a array index. The
 * first version of this script reported the Dwarka Expressway sector count in
 * 68 places, of which one was a claim. A published claim, by contrast, is
 * always inside a string: prose, an FAQ answer, a heading, a credential line.
 *
 * So the scan is over string contents only. It tracks quote state across the
 * whole file rather than per line, because blog prose runs to multi-line
 * template literals and a per-line scanner mis-detects those. Escapes are
 * honoured; `${...}` interpolation is left in the span, which is harmless
 * since it can only add text that is not a bare digit run.
 */
function proseSpans(text) {
  const spans = [];
  let i = 0;
  let line = 1;
  const n = text.length;
  while (i < n) {
    const ch = text[i];
    if (ch === "\n") {
      line++;
      i++;
      continue;
    }
    // Skip comments, so a number quoted in an explanatory note is not counted
    // as a published claim.
    if (ch === "/" && text[i + 1] === "/") {
      while (i < n && text[i] !== "\n") i++;
      continue;
    }
    if (ch === "/" && text[i + 1] === "*") {
      i += 2;
      while (i < n && !(text[i] === "*" && text[i + 1] === "/")) {
        if (text[i] === "\n") line++;
        i++;
      }
      i += 2;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      const quote = ch;
      const startLine = line;
      let buf = "";
      i++;
      while (i < n) {
        if (text[i] === "\\") {
          buf += text[i + 1] ?? "";
          i += 2;
          continue;
        }
        if (text[i] === quote) {
          i++;
          break;
        }
        if (text[i] === "\n") line++;
        buf += text[i];
        i++;
      }
      spans.push({ line: startLine, text: buf });
      continue;
    }
    i++;
  }
  return spans;
}

/**
 * Declared numeric fields: `propertyCount: 2098`, `avgPropertyPriceInr:
 * 21800000`. These are claims too — they feed eeat.productDataHook and the
 * structured data built from it — but they live outside string literals, so
 * they need their own pass. Only a bare `identifier: <digits>` form counts,
 * which no CSS value or array index takes.
 */
const NUMERIC_FIELD = /^\s*([A-Za-z_][\w]*)\s*:\s*(\d+)\s*,?\s*$/;

const FILES = CONTENT_ROOTS.flatMap((r) => walk(r))
  .map((f) => {
    const path = relative(process.cwd(), f);
    const raw = readFileSync(f, "utf8");
    return { path, raw, lines: raw.split("\n"), spans: proseSpans(raw) };
  })
  // The declaration itself is not a published claim.
  .filter((f) => !f.path.endsWith(join("lib", "content", "catalogueStats.ts")));

/** A number must not match inside a longer one: "58" must not hit "1,583". */
function boundedPattern(needle) {
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?<![\\d,.])${escaped}(?![\\d,.])`);
}

/**
 * Is this match a published claim, or a number that happens to live in a
 * string?
 *
 * Restricting the scan to string literals removed array indices and slice
 * bounds, but not the far larger source of noise: Tailwind class strings.
 * `w-[60px]`, `z-[60]`, `opacity-60` and `s-maxage=60` are all string contents,
 * and they buried the real Dwarka Expressway sector claims under 50 false hits.
 *
 * Two shapes count, and nothing else:
 *
 *   - the span IS the number ("103"), which is how the comparison tables in
 *     the guides hold their cells;
 *   - the number sits in a sentence — at least four plain alphabetic words of
 *     three or more letters within 80 characters of it.
 *
 * A utility-class span is rejected outright before either test, because the
 * word rule alone is not quite enough: "absolute right-4 top-4 ... px-2.5
 * py-1" yields absolute/top/px/py once the hyphenated suffixes are stripped,
 * which scraped past a four-word bar. The class-prefix signature below is what
 * actually distinguishes markup from prose.
 */
const UTILITY_CLASS =
  /(^|\s)(?:[a-z]+:)?(?:bg|text|px|py|pt|pb|pl|pr|mt|mb|ml|mr|mx|my|w|h|top|left|right|bottom|z|gap|space|rounded|border|opacity|inset|flex|grid|absolute|relative|fixed|sticky|hidden|duration|transition|translate|scale|shadow|ring|col|row|min|max)-/;

function isClaimContext(spanText, matchIndex, needle) {
  if (UTILITY_CLASS.test(spanText)) return false;
  if (spanText.trim() === needle) return true;
  const from = Math.max(0, matchIndex - 80);
  const context = spanText.slice(from, matchIndex + needle.length + 80);
  const words = context
    .split(/\s+/)
    .map((w) => w.replace(/^[^A-Za-z]+|[^A-Za-z]+$/g, ""))
    .filter((w) => /^[A-Za-z]{3,}$/.test(w));
  return words.length >= 4;
}

function occurrences(needle) {
  const re = boundedPattern(needle);
  const hits = [];
  const seen = new Set();
  const push = (file, line, text) => {
    const key = `${file}:${line}`;
    if (seen.has(key)) return;
    seen.add(key);
    hits.push({ file, line, text: text.trim().slice(0, 120) });
  };

  const global = new RegExp(re.source, "g");
  for (const file of FILES) {
    for (const span of file.spans) {
      global.lastIndex = 0;
      let m;
      while ((m = global.exec(span.text)) !== null) {
        if (isClaimContext(span.text, m.index, needle)) {
          // Report the line the match is on, not where the string opened.
          const lineWithin = span.text.slice(0, m.index).split("\n").length - 1;
          const lineNo = span.line + lineWithin;
          push(file.path, lineNo, file.lines[lineNo - 1] ?? span.text);
        }
        if (global.lastIndex === m.index) global.lastIndex++;
      }
    }
    if (!needle.includes(",")) {
      file.lines.forEach((line, i) => {
        const m = NUMERIC_FIELD.exec(line);
        if (m && m[2] === needle) push(file.path, i + 1, line);
      });
    }
  }
  return hits.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
}

// ── fetch and build the catalogue, exactly as fetchCityRaw does ─────────────

async function fetchSegment(segment) {
  const url = `${BASE}?city=${encodeURIComponent(segment)}&page=1&limit=${LIMIT}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`upstream ${res.status} for ${segment}`);
  const json = await res.json();
  return Array.isArray(json?.results) ? json.results : Array.isArray(json?.data) ? json.data : [];
}

/** Mirrors lib/intelligence/projects.ts fetchCityRaw(): normalize both
 *  category segments, drop owner exclusions, then collapse duplicates. */
async function loadProjects() {
  const [commercial, residential] = await Promise.all([
    fetchSegment(`${CITY_KEY}CommercialProjects`),
    fetchSegment(`${CITY_KEY}ResidentialProjects`),
  ]);
  const normalized = [
    ...commercial.map((r) => normalizeProject(r, CITY_KEY, "Commercial")),
    ...residential.map((r) => normalizeProject(r, CITY_KEY, "Residential")),
  ].filter((p) => !isExcludedProject(p.city_key, p.slug));
  return collapseDuplicateProjects(normalized).projects;
}

/** Mirrors lib/listings/segmentCache.ts loadSegment(): sanitize at the read
 *  boundary, which is where the classification and competitor corrections are
 *  applied for listings. */
async function loadListings() {
  return sanitizeSegment(await fetchSegment(`${CITY_KEY}SaleProperties`));
}

// ── query execution ─────────────────────────────────────────────────────────

const corridorBySlug = new Map(PROJECT_CORRIDORS.map((c) => [c.slug, c]));

function projectCorridor(p) {
  const blob = `${p.sector ?? ""} ${p.micro_market ?? ""} ${p.project_name ?? ""}`;
  for (const c of PROJECT_CORRIDORS) if (c.match.test(blob)) return c.slug;
  return null;
}

function median(values) {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

function matchesProject(p, q) {
  if (q.category && p.property_category !== q.category) return false;
  if (q.corridor) {
    if (!corridorBySlug.has(q.corridor)) throw new Error(`unknown corridor ${q.corridor}`);
    if (projectCorridor(p) !== q.corridor) return false;
  }
  if (q.status && projectStatusKind(p.project_status) !== q.status) return false;
  const price = p.min_price_inr;
  if (q.minEntryPriceInr != null && !(price != null && price >= q.minEntryPriceInr)) return false;
  if (q.maxEntryPriceInr != null && !(price != null && price < q.maxEntryPriceInr)) return false;
  return true;
}

function matchesListing(l, q) {
  if (q.bhk != null && Number(l.bedrooms) !== q.bhk) return false;
  return true;
}

/** Counts developer hubs the way lib/intelligence/projects.ts does: bucket on
 *  the canonical id, then keep the ones developerStatusFor() calls verified. */
function countVerifiedDevelopers(projects) {
  const buckets = new Map();
  for (const p of projects) {
    const builder = p.builder;
    if (!builder || builder === "Unknown" || builder.trim().length < 3) continue;
    const canonical = canonicalDeveloperByName(builder);
    const slug = canonical ? canonical.id : slugify(builder);
    if (!slug || slug.length < 3 || isInvalidDeveloperSlug(slug)) continue;
    buckets.set(slug, (buckets.get(slug) ?? 0) + 1);
  }
  let verified = 0;
  for (const [slug, count] of buckets) {
    if (developerStatusFor(slug, count, 2) === "verified") verified++;
  }
  return verified;
}

function runQuery(q, { projects, listings }) {
  if (q.dataset === "listings") {
    if (!listings) return null;
    const rows = listings.filter((l) => matchesListing(l, q));
    if (q.metric === "count") return rows.length;
    throw new Error(`metric ${q.metric} is not defined for the listings dataset`);
  }

  if (q.metric === "verifiedDevelopers") return countVerifiedDevelopers(projects);

  const rows = projects.filter((p) => matchesProject(p, q));
  switch (q.metric) {
    case "count":
      return rows.length;
    case "countWithPrice":
      return rows.filter((p) => p.min_price_inr != null).length;
    case "distinctSectors":
      return new Set(rows.map((p) => (p.sector ?? "").trim().toLowerCase()).filter(Boolean)).size;
    case "medianEntryPriceInr":
      return median(rows.map((p) => p.min_price_inr).filter((n) => typeof n === "number"));
    default:
      throw new Error(`unknown metric ${q.metric}`);
  }
}

// ── run ─────────────────────────────────────────────────────────────────────

const fmt = (n) => (typeof n === "number" ? n.toLocaleString("en-IN") : String(n));
const pct = (from, to) => (from === 0 ? "n/a" : `${to > from ? "+" : ""}${Math.round(((to - from) / from) * 100)}%`);

let catalogue = null;
let fetchError = null;
if (!offline) {
  try {
    const [projects, listings] = await Promise.all([loadProjects(), loadListings()]);
    catalogue = { projects, listings };
  } catch (err) {
    fetchError = err;
  }
}

const results = CATALOGUE_STATS.map((stat) => {
  const surfaces = stat.appearsAs.flatMap((needle) => occurrences(needle));
  let live = null;
  let error = null;
  if (catalogue) {
    try {
      live = runQuery(stat.query, catalogue);
    } catch (err) {
      error = err.message;
    }
  }
  return {
    id: stat.id,
    label: stat.label,
    definition: stat.definition,
    stated: stat.value,
    live,
    error,
    drifted: live != null && live !== stat.value,
    orphaned: stat.appearsAs.length > 0 && surfaces.length === 0,
    surfaces,
  };
});

if (asJson) {
  console.log(
    JSON.stringify(
      { measuredAt: STATS_MEASURED_AT, feedReachable: Boolean(catalogue), results },
      null,
      2
    )
  );
} else {
  console.log(`\nEditorial statistics — declared ${STATS_MEASURED_AT}, checked ${new Date().toISOString().slice(0, 10)}\n`);

  if (!catalogue) {
    console.log(
      offline
        ? "Offline mode: surfaces only, nothing measured against the catalogue.\n"
        : `Could not reach the catalogue feed (${fetchError?.message}).\nSurfaces below are still accurate; the live column is not measured.\n`
    );
  }

  const drifted = results.filter((r) => r.drifted);
  const orphaned = results.filter((r) => r.orphaned);

  console.log("FIGURE                                    STATED         LIVE           WHERE");
  console.log("-".repeat(96));
  for (const r of results) {
    const liveCell = r.error ? "error" : r.live == null ? "—" : fmt(r.live);
    const mark = r.drifted ? " *" : "  ";
    console.log(
      `${mark}${r.label.slice(0, 38).padEnd(38)}  ${fmt(r.stated).padStart(12)}  ${liveCell.padStart(12)}  ${r.surfaces.length} place${r.surfaces.length === 1 ? "" : "s"}`
    );
  }

  if (drifted.length > 0) {
    console.log(`\n\n${drifted.length} figure(s) have moved. Each published sentence below states a number that is no longer true.\n`);
    for (const r of drifted) {
      console.log(`\n${r.label}`);
      console.log(`  ${r.definition}`);
      console.log(`  stated ${fmt(r.stated)} -> live ${fmt(r.live)}  (${pct(r.stated, r.live)})`);
      if (r.surfaces.length === 0) {
        console.log(`  no occurrences found — update lib/content/catalogueStats.ts only`);
      } else {
        for (const s of r.surfaces) console.log(`    ${s.file}:${s.line}  ${s.text}`);
      }
    }
    console.log(
      `\nCorrect the prose AND the value in lib/content/catalogueStats.ts. Where a` +
        `\nsentence argues from the old figure ("81% are ready to move, so..."), rewrite` +
        `\nthe argument, not just the digits.`
    );
  }

  if (orphaned.length > 0) {
    console.log(`\n\n${orphaned.length} declared figure(s) appear in no file:\n`);
    for (const r of orphaned) console.log(`  ${r.id} (${fmt(r.stated)}) — ${r.label}`);
    console.log(`\nEither the prose was corrected without updating the declaration, or the claim\nis not actually made and the declaration should go.`);
  }

  if (drifted.length === 0 && catalogue) {
    console.log("\nNo drift: every declared figure matches the live catalogue.");
  }
  console.log("");
}

if (!catalogue && !offline) process.exit(2);
process.exit(results.some((r) => r.drifted) ? 1 : 0);
