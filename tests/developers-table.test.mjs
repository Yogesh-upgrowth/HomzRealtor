// Tests lib/content/developers.ts — the real module.
//
// Same temp-dir trick as tests/project-dedupe.test.mjs: the module imports
// "@/lib/intelligence/normalize", which Node's resolver cannot follow, so the
// real files are copied out with only the import specifiers rewritten.
// Nothing else changes, so a change to the canonical table in the repo is a
// change to what runs here.
//
// What this pins down, and why each one is worth a test:
//
//   * the EXTRA_ALIASES orphan guard, because three of the first six entries
//     written were dead (hung on slugs the table does not contain) and
//     nothing reported it;
//   * that invalid slugs are exactly the /developer/the and /developer/j
//     class and do NOT swallow a real developer's slug — a false positive
//     here 410s a working page;
//   * that the redirect map never points a canonical slug at another page,
//     which would be a redirect on a URL that must serve 200.
//
// Run: node --experimental-strip-types tests/developers-table.test.mjs

import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const dir = mkdtempSync(join(tmpdir(), "devtable-"));

writeFileSync(join(dir, "homzbackend.ts"), "export type RawHomzProperty = Record<string, any>;\n");
writeFileSync(
  join(dir, "dataQuality.ts"),
  readFileSync("lib/intelligence/dataQuality.ts", "utf8").replace(
    'from "@/lib/scraping/homzbackend"',
    'from "./homzbackend.ts"'
  )
);
writeFileSync(
  join(dir, "normalize.ts"),
  readFileSync("lib/intelligence/normalize.ts", "utf8").replace(
    'from "./dataQuality"',
    'from "./dataQuality.ts"'
  )
);
writeFileSync(
  join(dir, "developers.ts"),
  readFileSync("lib/content/developers.ts", "utf8").replace(
    'from "@/lib/intelligence/normalize"',
    'from "./normalize.ts"'
  )
);

const mod = await import(pathToFileURL(join(dir, "developers.ts")).href);
const {
  CANONICAL_DEVELOPERS,
  DEVELOPER_SLUG_REDIRECTS,
  canonicalDeveloperByName,
  canonicalDeveloperBySlug,
  developerRedirectTarget,
  developerStatusFor,
  isInvalidDeveloperSlug,
} = mod;

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

// ---------------------------------------------------------------- table shape

t("table is non-empty", CANONICAL_DEVELOPERS.length > 20, true);
t("every entry has a slug id", CANONICAL_DEVELOPERS.every((d) => /^[a-z0-9-]+$/.test(d.id)), true);
t("every seeded entry is verified", CANONICAL_DEVELOPERS.every((d) => d.status === "verified"), true);
t(
  "ids are unique",
  new Set(CANONICAL_DEVELOPERS.map((d) => d.id)).size === CANONICAL_DEVELOPERS.length,
  true
);

// The guard that would have caught "godrej-properties". If the module loaded
// at all, no EXTRA_ALIASES key is orphaned — this asserts the mapping it was
// meant to protect actually resolves.
t("alias resolves to canonical: Emaar India", canonicalDeveloperByName("Emaar India")?.id, "emaar");
t("alias resolves to canonical: Emaar MGF", canonicalDeveloperByName("Emaar MGF")?.id, "emaar");
t("alias resolves to canonical: Godrej Properties", canonicalDeveloperByName("Godrej Properties")?.id, "godrej");
t("alias resolves to canonical: GPL", canonicalDeveloperByName("GPL")?.id, "godrej");
t("alias resolves to canonical: DLF Limited", canonicalDeveloperByName("DLF Ltd")?.id, "dlf");
t("alias resolves to canonical: Gaurs", canonicalDeveloperByName("Gaurs")?.id, "gaursons");
t("canonical name resolves to itself", canonicalDeveloperByName("DLF")?.id, "dlf");
t("name lookup is case-insensitive", canonicalDeveloperByName("dlf limited")?.id, "dlf");
t("name lookup trims", canonicalDeveloperByName("  M3M India ")?.id, "m3m");
t("unknown name does not resolve", canonicalDeveloperByName("Acme Buildwell"), undefined);
t("empty name does not resolve", canonicalDeveloperByName(""), undefined);

t("slug lookup finds a known developer", canonicalDeveloperBySlug("signature-global")?.canonicalName, "Signature Global");
t("slug lookup is case-insensitive", canonicalDeveloperBySlug("DLF")?.id, "dlf");
t("slug lookup rejects an alias slug", canonicalDeveloperBySlug("emaar-india"), undefined);

// ------------------------------------------------------------- invalid slugs

t("invalid: the", isInvalidDeveloperSlug("the"), true);
t("invalid: j (single letter)", isInvalidDeveloperSlug("j"), true);
t("invalid: any single letter", isInvalidDeveloperSlug("x"), true);
t("invalid: empty", isInvalidDeveloperSlug(""), true);
t("invalid: whitespace only", isInvalidDeveloperSlug("   "), true);
t("invalid: digits only", isInvalidDeveloperSlug("123"), true);
t("invalid: apartment", isInvalidDeveloperSlug("apartment"), true);
t("invalid: sector", isInvalidDeveloperSlug("sector"), true);
t("invalid: huda", isInvalidDeveloperSlug("huda"), true);
t("invalid: case-insensitive", isInvalidDeveloperSlug("The"), true);

// The dangerous direction. Each of these is a real developer slug, and a false
// positive would 410 a page that must serve 200.
for (const slug of ["dlf", "m3m", "emaar", "godrej", "signature-global", "ss-group", "rof", "ats", "aipl"]) {
  t(`valid: ${slug}`, isInvalidDeveloperSlug(slug), false);
}
// Not in the table, but plainly not a parser artefact either — must not 410,
// because it is very likely a real developer the list has not caught up with.
t("valid: unlisted plausible name", isInvalidDeveloperSlug("acme-buildwell"), false);
// "ROF" is 3 letters and a real developer; the <2-letter rule must not reach it.
t("valid: three-letter developer", isInvalidDeveloperSlug("rof"), false);

// --------------------------------------------------------------- redirect map

t("redirect: emaar-india -> emaar", developerRedirectTarget("emaar-india"), "emaar");
t("redirect: godrej-properties -> godrej", developerRedirectTarget("godrej-properties"), "godrej");
t("redirect: gaurs -> gaursons", developerRedirectTarget("gaurs"), "gaursons");
t("redirect: unknown slug is null", developerRedirectTarget("acme-buildwell"), null);
t("redirect: canonical slug is null", developerRedirectTarget("emaar"), null);
t("redirect: case-insensitive", developerRedirectTarget("EMAAR-INDIA"), "emaar");

// A redirect source that is itself a canonical slug would make a 200 page
// permanently redirect — the one way this map can take the site down.
const canonicalIds = new Set(CANONICAL_DEVELOPERS.map((d) => d.id));
t(
  "no redirect source is a canonical slug",
  Object.keys(DEVELOPER_SLUG_REDIRECTS).filter((s) => canonicalIds.has(s)),
  []
);
t(
  "every redirect target is a canonical slug",
  Object.values(DEVELOPER_SLUG_REDIRECTS).filter((s) => !canonicalIds.has(s)),
  []
);
// And a redirect source must not also be 410'd — middleware checks redirect
// first, so this would be unreachable rather than wrong, but it would mean the
// two lists disagree about the same slug.
t(
  "no redirect source is an invalid slug",
  Object.keys(DEVELOPER_SLUG_REDIRECTS).filter((s) => isInvalidDeveloperSlug(s)),
  []
);

// -------------------------------------------------------------------- status

t("status: verified table entry with enough projects", developerStatusFor("dlf", 40, 2), "verified");
t("status: verified table entry at the floor", developerStatusFor("dlf", 2, 2), "verified");
t("status: verified table entry below the floor", developerStatusFor("dlf", 1, 2), "unverified");
t("status: unlisted name with inventory", developerStatusFor("acme-buildwell", 9, 2), "unverified");
t("status: invalid slug, whatever the count", developerStatusFor("the", 34, 2), "invalid");
t("status: single letter with inventory is still invalid", developerStatusFor("j", 12, 2), "invalid");

console.log(fail === 0 ? "\nAll developer-table tests passed." : `\n${fail} test(s) failed.`);
process.exit(fail === 0 ? 0 : 1);
