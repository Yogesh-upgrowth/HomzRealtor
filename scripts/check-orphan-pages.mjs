#!/usr/bin/env node
// Finds orphan and weakly-linked pages: indexable route families that nothing
// on the site links to (2026-09-21).
//
// Usage: npm run check:orphans          (exits 1 if any orphan is found)
//        npm run check:orphans -- --all (also lists healthy families)
//
// WHY A STATIC CHECK, not a crawler. A crawler needs the site up and the feed
// reachable; this needs neither, so it runs in CI and on a laptop, and it
// catches an orphan the moment the route is added rather than after the next
// crawl. The trade-off is that it reasons about route *families*
// (/buy-property/[city]/[slug]) rather than individual URLs — it cannot tell
// you that Sector 91's hub specifically has no inbound link, only that the
// family as a whole is linked. For per-URL coverage the sitemap reconciliation
// in check-sitemap-404s.mjs is the tool, and Search Console is the truth.
//
// WHAT COUNTS AS AN ORPHAN. A page Google is invited to index (it is in the
// sitemap, or simply indexable) that no other page links to. Google reaches it
// only via the sitemap, which is a hint rather than a path, so it gets close
// to no crawl priority and inherits no internal link equity. Deliberately
// noindex routes are excluded — an unlinked noindex page is not a problem,
// it's the intended state.
//
// The link count is a signal, not a verdict: one inbound link from a page
// nobody visits is technically not an orphan and practically still buried.
// That is why WEAK_THRESHOLD exists and why nav links are counted separately.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const APP = "app";
const SCAN_DIRS = ["app", "components", "lib"];
const WEAK_THRESHOLD = 2;

// Route families that are legitimately unlinked, with the reason. Anything
// here has been looked at and judged fine; anything not here and unlinked is
// reported. Keep the reasons — an unexplained allowlist entry is how a real
// orphan gets permanently hidden.
const ALLOWED_UNLINKED = {
  "/": "the homepage is the crawl entry point, nothing needs to link to it",
  "/login": "noindex auth page, reached from the account UI",
  "/signup": "noindex auth page, reached from the account UI",
  "/api-docs": "noindex, linked from llms.txt rather than the site chrome",
};

// Routes linked through a helper function rather than a visible href, which
// static analysis cannot follow. Each entry names the helper and the file so
// the claim is checkable — this is not a way to silence a finding, and an
// entry whose named link no longer exists is a bug in itself.
//
// Kept separate from ALLOWED_UNLINKED because the meaning is different: those
// routes have no inbound link and that is fine; these DO have one and the
// checker just cannot see it.
const LINKED_VIA_HELPER = {
  "/author/[slug]":
    "components/Blog/BlogPostV27Article.tsx byline, href={authorProfilePath(post.author.name)} " +
    "(lib/content/authors.ts) — verified present in the rendered blog HTML",
};

// ---------------------------------------------------------------- route walk

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

/** Every page route in the app directory, as a URL pattern. */
function routeFamilies() {
  const families = [];
  for (const file of walk(APP)) {
    if (!/[/\\]page\.tsx$/.test(file)) continue;
    // The root route is "app/page.tsx", where there is no separator to strip —
    // hence the alternation. Without it the homepage came out as "/page.tsx"
    // and was reported as an orphan.
    const rel = relative(APP, file).replace(/(^|[/\\])page\.tsx$/, "");
    // Route groups "(name)" and parallel/intercepted segments do not appear in
    // the URL.
    const segments = rel
      .split(/[/\\]/)
      .filter((s) => s && !/^\(.*\)$/.test(s) && !/^@/.test(s));
    const pattern = "/" + segments.join("/");
    families.push({
      pattern: pattern === "/" ? "/" : pattern,
      segments,
      file,
      source: readFileSync(file, "utf8"),
    });
  }
  return families;
}

/** True when the route declares itself noindex. Covers both a literal
 *  `index: false` and the derived gates the service pages use. */
function isNoindex(family) {
  if (/index:\s*false/.test(family.source)) return true;
  // app/admin, /account and /dashboard declare noindex in their layouts.
  const top = family.segments[0];
  return ["admin", "account", "dashboard", "api"].includes(top);
}

// ----------------------------------------------------------------- link walk

/**
 * Every internal link target in the codebase, normalised so a template
 * expression becomes a wildcard segment.
 *
 * Matches both `href="/literal"` and href={`/tpl/${x}`}, which is how this
 * codebase writes them. A bare variable href (href={someVar}) cannot be
 * resolved statically, so those are collected separately and reported — they
 * are the blind spot in this check, not something to pretend does not exist.
 */
function linkTargets() {
  const literal = [];
  const dynamic = [];

  for (const dir of SCAN_DIRS) {
    for (const file of walk(dir)) {
      if (!/\.(tsx|ts)$/.test(file)) continue;
      const src = readFileSync(file, "utf8");

      // href="/..." and href={"/..."}
      for (const m of src.matchAll(/href=\{?"(\/[^"]*)"/g)) {
        literal.push({ href: m[1], file });
      }
      // href={`/...`}
      for (const m of src.matchAll(/href=\{`(\/[^`]*)`/g)) {
        literal.push({ href: m[1], file });
      }

      // The href built into a variable first, then passed to <Link>. This is
      // how every pagination control and the blog byline are written, and
      // treating them as unresolvable reported six perfectly well-linked
      // pagination routes as orphans.
      //
      // Restricted to variables whose name says they hold a URL, and to values
      // that are path-shaped. Slurping every string literal in the codebase
      // would over-report coverage and quietly hide real orphans, which is the
      // failure direction that matters for this tool.
      const URL_VAR = /\b(?:const|let)\s+\w*(?:[hH]ref|[uU]rl|[pP]ath)\w*\s*=\s*([^;]+);/g;
      for (const m of src.matchAll(URL_VAR)) {
        for (const lit of m[1].matchAll(/[`"'](\/[^`"']*)[`"']/g)) {
          literal.push({ href: lit[1], file });
        }
        // `${basePath}/page/${n}` — a leading expression standing for a path
        // prefix this check cannot resolve, recorded as a wildcard segment so
        // the deeper route shape still gets credit. That is how every
        // pagination control is written.
        //
        // ABSOLUTE_BASE is excluded and the exclusion is the point: a
        // `const pageUrl = ${SITE}/developer` is a canonical-URL declaration,
        // not a link to anywhere. Treating it as a path prefix produced
        // "/*/developer", which then matched /author/[slug] and credited that
        // route with an inbound link from a page that does not link to it —
        // a false pass, which is the one outcome this tool must not produce.
        // "**" absorbs one or more segments, because the prefix's DEPTH is
        // unknowable here as well as its value: `${basePath}/page/${n}` in the
        // faceted template expands at runtime to
        // /buy-property/gurgaon/3-bhk/page/2, a three-segment prefix. Encoding
        // it as a single wildcard matched only three-segment routes and left
        // both facet pagination routes reported as orphans when they are
        // linked by every pagination control on the site.
        const ABSOLUTE_BASE = /^(SITE|BASE_URL|SITE_URL|ORIGIN|baseUrl|siteUrl)$/;
        for (const lit of m[1].matchAll(/`\$\{([^}]*)\}(\/[^`]*)`/g)) {
          if (ABSOLUTE_BASE.test(lit[1].trim())) continue;
          literal.push({ href: `/**${lit[2]}`, file });
        }
      }

      // href={expression} that is not a string literal or template
      for (const m of src.matchAll(/href=\{(?!`|")([^}]+)\}/g)) {
        const expr = m[1].trim();
        if (expr.startsWith("/")) continue;
        dynamic.push({ expr, file });
      }
    }
  }

  return { literal, dynamic };
}

/** "/buy-property/gurgaon/${r.slug}" -> ["buy-property", "gurgaon", "*"] */
function hrefSegments(href) {
  return href
    .replace(/\?[^]*$/, "")
    .replace(/#[^]*$/, "")
    .replace(/\$\{[^}]*\}/g, "*")
    .split("/")
    .filter(Boolean);
}

/** Does this link target land inside this route family? A dynamic route
 *  segment accepts anything; a literal route segment accepts only itself or a
 *  wildcard. */
function segmentMatches(routeSeg, linkSeg) {
  if (/^\[.*\]$/.test(routeSeg)) return true; // [slug], [...rest]
  return routeSeg === linkSeg || linkSeg === "*";
}

function matches(family, segs) {
  // A leading "**" stands for an unresolved prefix of unknown depth: match the
  // tail against the end of the route and require the route to be at least as
  // deep.
  if (segs[0] === "**") {
    const tail = segs.slice(1);
    if (family.segments.length < tail.length + 1) return false;
    const offset = family.segments.length - tail.length;
    return tail.every((linkSeg, i) => segmentMatches(family.segments[offset + i], linkSeg));
  }

  if (family.segments.length !== segs.length) return false;
  return family.segments.every((routeSeg, i) => segmentMatches(routeSeg, segs[i]));
}

// -------------------------------------------------------------------- report

const families = routeFamilies();
const { literal, dynamic } = linkTargets();

const navFiles = /components[/\\](Header|Footer)[/\\]/;
const unresolvedLinks = [];

for (const family of families) {
  family.inbound = [];
  family.navInbound = 0;
}

/**
 * How specifically this link identifies this family: the number of positions
 * where the link states a literal segment and the route states the same one.
 *
 * Deliberately a property of the MATCH, not of the route. Ranking candidates
 * by the route's own literal count instead meant a link whose first segment is
 * a variable — href={`/${routeBase}/gurgaon/${slug}`}, the shared property
 * card — was handed entirely to /project-listing/[city]/sectors, which has two
 * literal segments, starving the four detail routes it actually covers and
 * reporting /commercial/[city]/[slug] and /pg-property/[city]/[slug] as
 * orphans. Scored this way that link ties at zero against every candidate, so
 * all of them are credited, which is the truth: one link, four possible
 * destinations, no way to tell them apart statically.
 */
const matchSpecificity = (family, segs) => {
  if (segs[0] === "**") {
    const tail = segs.slice(1);
    const offset = family.segments.length - tail.length;
    return tail.filter(
      (linkSeg, i) =>
        !/^\[.*\]$/.test(family.segments[offset + i]) && family.segments[offset + i] === linkSeg
    ).length;
  }
  return family.segments.filter(
    (routeSeg, i) => !/^\[.*\]$/.test(routeSeg) && routeSeg === segs[i]
  ).length;
};

for (const link of literal) {
  const segs = hrefSegments(link.href);

  // A link with no literal segment at all identifies no particular route, so
  // it credits none. href={`/${routeBase}`} — the hub link in the shared
  // listing components — was otherwise matching every single-segment route on
  // the site and crediting /faq, /terms, /blog and the rest with inbound links
  // that do not exist. /faq in particular came out with five sources when it
  // has one, which would have hidden exactly the finding this tool is for.
  //
  // href={`/${routeBase}/gurgaon/${slug}`} still counts: "gurgaon" pins the
  // shape even though the first segment is unknown.
  if (segs.every((s) => s === "*" || s === "**")) {
    unresolvedLinks.push({ href: link.href, file: link.file });
    continue;
  }

  const candidates = families.filter((f) => matches(f, segs));
  if (candidates.length === 0) continue;

  // Attribute to the most specific families the link could land in, so a link
  // to /buy-property is not also counted as coverage of
  // /buy-property/[city]/[slug].
  //
  // ALL families at that specificity get the credit, not one of them. This
  // matters because the shared card component links
  // href={`/${routeBase}/gurgaon/${slug}`}, where the first segment is a
  // variable — that single link genuinely covers the Sale, Rent, PG and
  // Commercial detail routes equally, and crediting only the first match
  // reported the other three as orphans. Same for
  // /project-listing/[city]/sectors/[sector] versus
  // /project-listing/[city]/[slug]/flat, which tie at two literal segments.
  const best = Math.max(...candidates.map((f) => matchSpecificity(f, segs)));
  for (const family of candidates) {
    if (matchSpecificity(family, segs) !== best) continue;
    // A page linking to itself is not inbound coverage.
    if (link.file === family.file) continue;
    family.inbound.push(link.file);
    if (navFiles.test(link.file)) family.navInbound += 1;
  }
}

const indexable = families.filter((f) => !isNoindex(f));
const orphans = [];
const weak = [];
const healthy = [];
const viaHelper = [];

for (const f of indexable) {
  const unique = [...new Set(f.inbound)];
  if (unique.length === 0) {
    if (ALLOWED_UNLINKED[f.pattern]) continue;
    if (LINKED_VIA_HELPER[f.pattern]) {
      viaHelper.push({ ...f, note: LINKED_VIA_HELPER[f.pattern] });
      continue;
    }
    orphans.push({ ...f, unique });
  } else if (unique.length < WEAK_THRESHOLD) {
    weak.push({ ...f, unique });
  } else {
    healthy.push({ ...f, unique });
  }
}

const showAll = process.argv.includes("--all");

console.log("\nHomzRealtor — orphan and interlinking check\n");
console.log(
  `${families.length} page routes, ${indexable.length} indexable, ` +
    `${literal.length} resolvable internal links.\n`
);

if (orphans.length > 0) {
  console.log(`ORPHANS — indexable, nothing links here (${orphans.length})\n`);
  for (const f of orphans) {
    console.log(`  [!] ${f.pattern}`);
    console.log(`      ${f.file}`);
    console.log("");
  }
} else {
  console.log("ORPHANS — none. Every indexable route family has an inbound link.\n");
}

if (viaHelper.length > 0) {
  console.log(`LINKED VIA A HELPER — not statically visible (${viaHelper.length})\n`);
  for (const f of viaHelper) {
    console.log(`  [x] ${f.pattern}`);
    console.log(`      ${f.note}`);
    console.log("");
  }
}

if (weak.length > 0) {
  console.log(`WEAKLY LINKED — one inbound source only (${weak.length})\n`);
  for (const f of weak) {
    console.log(`  [~] ${f.pattern}`);
    console.log(`      linked from: ${f.unique.join(", ")}`);
    console.log("");
  }
}

if (showAll) {
  console.log(`LINKED (${healthy.length})\n`);
  for (const f of healthy.sort((a, b) => b.unique.length - a.unique.length)) {
    const nav = f.navInbound > 0 ? " [nav]" : "";
    console.log(`  [x] ${f.pattern} — ${f.unique.length} sources${nav}`);
  }
  console.log("");
}

if (dynamic.length > 0) {
  console.log(
    `Note: ${dynamic.length} href expressions could not be resolved statically ` +
      `(href={variable}). They may provide coverage this check cannot see:\n`
  );
  for (const d of [...new Set(dynamic.map((d) => `${d.expr} — ${d.file}`))].slice(0, 12)) {
    console.log(`  ?  ${d}`);
  }
  console.log("");
}

console.log(
  "Route families, not individual URLs — see the header comment. " +
    "For per-URL coverage use npm run check:sitemap and Search Console.\n"
);

process.exit(orphans.length > 0 ? 1 : 0);
