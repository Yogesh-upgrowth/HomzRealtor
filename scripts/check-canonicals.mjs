#!/usr/bin/env node
// The canonical audit (2026-09-22).
//
// Usage: npm run check:canonicals
//
// Checklist item 17: "Every indexable page should have one clear canonical.
// Check: www vs non-www, http vs https, trailing slash vs non-trailing slash,
// query parameters, pagination, sort URLs, filter URLs, project aliases."
//
// A one-off manual pass would answer that for today and be wrong by the next
// route anyone adds, so this is a check rather than a report. It fails (exit 1)
// when a route is indexable and declares no canonical, and prints the status of
// each host- and URL-shape rule with the file and mechanism that enforces it.
//
// WHAT IT CAN AND CANNOT SEE. It reads the route files statically: it knows
// whether a route declares `alternates.canonical` or a `robots` directive, and
// it knows which redirect rules exist. It cannot fetch the live site, so it
// cannot prove a redirect actually fires — that needs one curl per rule after
// deploy, and the report says so rather than implying it checked.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const APP = "app";

// Routes that are deliberately not indexable and therefore need no canonical.
// Each entry names why, so this list cannot quietly become a place to silence
// a real finding.
const NOT_INDEXABLE = [
  { pattern: /^app\/admin\//, why: "private area, noindex via app/admin/layout.tsx" },
  { pattern: /^app\/account\//, why: "private area, noindex via app/account/layout.tsx" },
  { pattern: /^app\/dashboard\//, why: "private area, requires auth" },
  { pattern: /^app\/(login|signup)\//, why: "auth screens" },
  { pattern: /^app\/api\//, why: "API route, not a page" },
];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (name === "page.tsx" || name === "route.ts") out.push(full);
  }
  return out;
}

/** app/buy-property/[city]/[slug]/page.tsx -> /buy-property/[city]/[slug] */
function routeOf(file) {
  return (
    "/" +
    relative(APP, file)
      .replace(/(^|[/\\])(page\.tsx|route\.ts)$/, "")
      .replace(/\\/g, "/")
      .split("/")
      .filter((seg) => !(seg.startsWith("(") && seg.endsWith(")")))
      .join("/")
  );
}

const files = walk(APP);
const findings = [];
const checked = [];

for (const file of files) {
  const rel = file.replace(/\\/g, "/");
  const skip = NOT_INDEXABLE.find((n) => n.pattern.test(rel));
  if (skip) continue;

  const src = readFileSync(file, "utf8");
  const route = routeOf(file);

  // Metadata routes (sitemap, robots, manifest) and plain handlers are not
  // pages a canonical applies to.
  if (/^\/(sitemap|robots|manifest|opengraph-image|icon|apple-icon)/.test(route)) continue;
  if (rel.endsWith("route.ts")) continue;

  const hasCanonical = /alternates\s*:\s*\{[^}]*canonical/s.test(src) || /canonical\s*:/.test(src);
  const hasNoindex = /robots\s*:\s*\{[^}]*index\s*:\s*false/s.test(src);
  // Some routes get both their metadata and their canonical from a shared
  // factory rather than declaring it inline.
  const viaFactory = /makePropertyDetailPage|generateMetadata\s*\}?\s*=\s*make/.test(src);

  checked.push(route);
  if (!hasCanonical && !hasNoindex && !viaFactory) {
    findings.push({ route, file: rel, issue: "no canonical and no noindex" });
  }
}

// ── URL-shape rules, and where each is enforced ────────────────────────────

const middleware = readFileSync("middleware.ts", "utf8");
const nextConfig = readFileSync("next.config.ts", "utf8");

const RULES = [
  {
    name: "non-www -> www",
    ok: /APEX_HOST/.test(middleware) && /NextResponse\.redirect/.test(middleware),
    where: "middleware.ts (308), plus the host redirect in Vercel's domain settings",
  },
  {
    name: "http -> https",
    ok: /x-forwarded-proto/.test(middleware),
    where: "middleware.ts (308), single hop combined with the host fix",
  },
  {
    name: "mixed case -> lowercase",
    ok: /needsLowercase/.test(middleware),
    where: "middleware.ts (308)",
  },
  {
    name: "trailing slash",
    ok: !/trailingSlash\s*:\s*true/.test(nextConfig),
    where:
      "Next's default trailingSlash:false redirects /foo/ to /foo. Nothing in next.config.ts overrides it.",
  },
  {
    name: "filter / sort / search query strings",
    ok: /isIndexableListingUrl/.test(readFileSync("lib/listings/filters.ts", "utf8")),
    where:
      "lib/listings/filters.ts isIndexableListingUrl(), applied in the buy/rent/commercial hub generateMetadata. Filtered URLs get noindex,follow and NO canonical — pointing a noindex page's canonical at the clean hub risks the noindex being applied to the hub.",
  },
  {
    name: "pagination",
    ok: /\/page\/\$\{pageNum\}|page\/\[page\]/.test(
      readFileSync("components/PropertyListing/PaginatedListingPage.tsx", "utf8")
    ),
    where: "each /page/N self-canonicals; page 1 404s so it cannot duplicate the hub",
  },
  {
    name: "project aliases (collapsed duplicates)",
    ok: /permanentRedirect/.test(readFileSync("app/project-listing/[city]/[slug]/page.tsx", "utf8")),
    where: "getProjectBySlugResolved() + permanentRedirect to the surviving slug",
  },
  {
    name: "developer aliases",
    ok: /developerRedirectTarget/.test(middleware),
    where: "middleware.ts 301 to the canonical developer hub",
  },
  {
    name: "compare pair ordering",
    ok: /permanentRedirect/.test(
      readFileSync("app/project-listing/compare/[city]/[slugA]/[slugB]/page.tsx", "utf8")
    ),
    where: "unsorted slug pairs permanently redirect to the sorted form",
  },
];

console.log("\nCanonical audit\n");
console.log(`${checked.length} indexable page routes checked.\n`);

console.log("URL-shape rules:\n");
let ruleFailures = 0;
for (const r of RULES) {
  if (!r.ok) ruleFailures++;
  console.log(`  ${r.ok ? "ok  " : "MISS"}  ${r.name}`);
  console.log(`        ${r.where}`);
}

if (findings.length > 0) {
  console.log(`\n\n${findings.length} route(s) with no canonical and no noindex:\n`);
  for (const f of findings) console.log(`  ${f.route}\n    ${f.file}`);
  console.log(
    "\nEvery indexable page needs one. Add alternates.canonical, or robots\n" +
      "index:false if the page should not be indexed at all."
  );
} else {
  console.log("\n\nEvery indexable page route declares a canonical or an explicit noindex.");
}

console.log(
  "\nNot checked here: whether the redirects actually fire in production. That is\n" +
    "one curl -I per rule after deploy, and this script cannot reach the live site.\n"
);

process.exit(findings.length > 0 || ruleFailures > 0 ? 1 : 0);
