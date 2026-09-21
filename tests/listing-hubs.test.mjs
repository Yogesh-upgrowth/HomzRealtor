// Tests the location-hub engine — the real modules, not reimplementations.
//
// Same temp-dir trick as tests/developer-profile.test.mjs: these modules
// import siblings extensionlessly and via the "@/" alias, neither of which
// Node's ESM resolver handles for .ts files, so the real files are copied out
// with only those specifiers rewritten. Nothing else is changed, so a change
// to the rules in the repo is a change to what runs here.
//
// Run: node --experimental-strip-types tests/listing-hubs.test.mjs

import { mkdtempSync, copyFileSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const dir = mkdtempSync(join(tmpdir(), "listing-hubs-"));

// listingLocation.ts imports only a type from the scraping module, which
// strip-types erases, so a stub satisfies it.
writeFileSync(join(dir, "homzbackend.ts"), "export type RawHomzProperty = Record<string, unknown>;\n");
writeFileSync(
  join(dir, "listingLocation.ts"),
  readFileSync("lib/listings/listingLocation.ts", "utf8").replace(
    'from "@/lib/scraping/homzbackend"',
    'from "./homzbackend.ts"'
  )
);
const { listingSectorToken, listingCorridorSlug, sectorLabelFromToken } = await import(
  pathToFileURL(join(dir, "listingLocation.ts")).href
);

// postHubLinks.ts has no imports at all.
copyFileSync("lib/content/postHubLinks.ts", join(dir, "postHubLinks.ts"));
const { hubLinksForPost } = await import(pathToFileURL(join(dir, "postHubLinks.ts")).href);

let fail = 0;
const t = (label, actual, expected) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) {
    fail++;
    console.log(`FAIL ${label}\n  expected ${JSON.stringify(expected)}\n  actual   ${JSON.stringify(actual)}`);
  } else {
    console.log(`PASS ${label}  => ${JSON.stringify(actual)}`);
  }
};

const p = (location, title = "") => ({ location, title });

// --- sector extraction ----------------------------------------------------
t("plain sector", listingSectorToken(p("Sector 65, Gurgaon")), "65");
t("abbreviated", listingSectorToken(p("Sec 65, Gurgaon")), "65");
t("hyphenated", listingSectorToken(p("Sector-65, Gurgaon")), "65");
t("dotted", listingSectorToken(p("Sec. 65 Gurgaon")), "65");
t("letter suffix kept and lowercased", listingSectorToken(p("Sector 82A, Gurgaon")), "82a");
t("falls back to title", listingSectorToken(p("Golf Course Extension Road", "3 BHK in Sector 65")), "65");
t("no sector -> null", listingSectorToken(p("Golf Course Road, Gurgaon")), null);

// The guard that matters most: a leading substring must not match a longer
// number. "Sector 6" and "Sector 65" are different places, and a naive
// includes() check on the location string conflates them.
t("Sector 6 is not Sector 65", listingSectorToken(p("Sector 6, Gurgaon")), "6");
t("Sector 65 is not Sector 6", listingSectorToken(p("Sector 65, Gurgaon")), "65");

// Out-of-range and other-town guards.
t("out-of-range sector rejected", listingSectorToken(p("Sector 150, Noida")), null);
t("sector 0 rejected", listingSectorToken(p("Sector 0")), null);
t("Sohna town's own sector rejected", listingSectorToken(p("Sector 6, Sohna")), null);
// ...but Sohna ROAD is a Gurgaon corridor along which real Gurgaon sectors
// sit. This is the lookahead that stops a whole corridor being discarded.
t("Sohna Road sector kept", listingSectorToken(p("Sector 48, Sohna Road, Gurgaon")), "48");
t("Noida sector rejected", listingSectorToken(p("Sector 62, Noida")), null);
t("Faridabad sector rejected", listingSectorToken(p("Sector 21, Faridabad")), null);
// A distant mention of another city must not disqualify a real sector.
t(
  "distant Noida mention ok",
  listingSectorToken(p("Sector 65, Gurgaon", "Great connectivity, 45 minutes to Noida by road")),
  "65"
);

t("sector label formatting", sectorLabelFromToken("82a"), "Sector 82A");
t("sector label plain", sectorLabelFromToken("65"), "Sector 65");

// --- corridor extraction --------------------------------------------------
// Ordering guard: "Golf Course Road" is a substring of how people write
// "Golf Course Extension Road", and the two are different corridors with
// materially different rates. Extension must win.
t(
  "extension road wins over golf course road",
  listingCorridorSlug(p("Sector 65, Golf Course Extension Road, Gurgaon")),
  "golf-course-extension-road"
);
t("golf course ext abbreviation", listingCorridorSlug(p("Golf Course Ext Road")), "golf-course-extension-road");
t("GCE abbreviation", listingCorridorSlug(p("Sector 65, GCE, Gurgaon")), "golf-course-extension-road");
t("plain golf course road", listingCorridorSlug(p("DLF Phase 5, Golf Course Road")), "golf-course-road");
t("dwarka expressway", listingCorridorSlug(p("Sector 102, Dwarka Expressway")), "dwarka-expressway");
t("sohna road", listingCorridorSlug(p("Sector 48, Sohna Road")), "sohna-road");
t("SPR abbreviation", listingCorridorSlug(p("Sector 70, SPR")), "southern-peripheral-road");
t("new gurgaon", listingCorridorSlug(p("Sector 86, New Gurgaon")), "new-gurgaon");
t("no corridor -> null", listingCorridorSlug(p("Sector 65, Gurgaon")), null);
// "spr" as a bare word only — it must not fire on an unrelated substring.
t("spr does not match inside a word", listingCorridorSlug(p("Sprawling villa in Sector 65")), null);

// --- editorial hub links --------------------------------------------------
const hrefs = (slug, kw, tags = []) => hubLinksForPost(slug, kw, tags).map((l) => l.href);

t(
  "dwarka expressway post links its corridor first",
  hrefs("best-projects-on-dwarka-expressway", "projects on Dwarka Expressway").slice(0, 2),
  ["/buy-property/gurgaon/dwarka-expressway", "/rent-property/gurgaon/dwarka-expressway"]
);
t(
  "golf course extension post does not link plain golf course road",
  hrefs("best-projects-on-golf-course-extension-road", "projects in Golf Course Extension Road").includes(
    "/buy-property/gurgaon/golf-course-road"
  ),
  false
);
t(
  "3 bhk post links the 3 bhk facets",
  hrefs("best-3-bhk-flats-in-gurgaon", "3 BHK flats in Gurgaon").slice(0, 2),
  ["/buy-property/gurgaon/3-bhk", "/rent-property/gurgaon/3-bhk"]
);
t(
  "under 1 crore post links that budget",
  hrefs("flats-in-gurgaon-under-1-crore", "flats in Gurgaon under 1 crore")[0],
  "/buy-property/gurgaon/under-1-crore"
);
t(
  "ready to move post links that facet",
  hrefs("ready-to-move-flats-in-gurgaon", "ready to move flats in Gurgaon")[0],
  "/buy-property/gurgaon/ready-to-move"
);
t(
  "plots post links plots",
  hrefs("best-plots-in-gurgaon-for-investment", "plots in Gurgaon")[0],
  "/buy-property/gurgaon/plots"
);
// A tag the slug does not mention still steers the links.
t(
  "tags are read too",
  hrefs("best-places-to-live-in-gurgaon", "best places to live in Gurgaon", ["Sohna Road"])[0],
  "/buy-property/gurgaon/sohna-road"
);
// Every post gets the always-on links, and nothing is ever duplicated or
// unbounded.
t(
  "generic post still gets the rates page",
  hrefs("is-gurgaon-good-for-property-investment", "property investment in Gurgaon"),
  ["/property-rates-in-gurgaon", "/buy-property", "/rent-property"]
);
const many = hrefs("luxury-apartments-on-golf-course-road", "luxury apartments Golf Course Road");
t("capped at six", many.length <= 6, true);
t("no duplicate hrefs", new Set(many).size === many.length, true);

console.log(fail === 0 ? "\nALL PASS" : `\n${fail} FAILED`);
process.exit(fail ? 1 : 0);
