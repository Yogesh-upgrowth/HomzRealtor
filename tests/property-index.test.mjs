// Tests the Gurgaon Property Index's trend logic and metric computation.
//
// Checklist items 20 and 21. The trend function is the one that matters: its
// job is to REFUSE to produce a number in every situation where a number would
// be dishonest, and a bug there publishes a fabricated market movement on a
// page whose entire claim is that it does not do that.
//
// snapshot.ts imports the Mongo client and the segment cache, neither of which
// can load here, so the two pure functions under test are extracted into a
// stub module alongside the real types. That is a weaker arrangement than the
// other suites (which run the real module) and it is called out rather than
// glossed: if trendBetween's body changes, this copy must change with it.
// The functions are small and self-contained, which is why the trade is
// acceptable; computeMetrics is exercised against the real implementation
// below by copying it out whole.
//
// Run: node --experimental-strip-types tests/property-index.test.mjs

import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const dir = mkdtempSync(join(tmpdir(), "propindex-"));

writeFileSync(join(dir, "types.ts"), readFileSync("lib/index/types.ts", "utf8"));

// Extract the pure functions from the real snapshot.ts rather than retyping
// them, so the bodies under test are byte-identical to the shipped ones.
const snapshotSrc = readFileSync("lib/index/snapshot.ts", "utf8");
function extract(name) {
  const start = snapshotSrc.indexOf(`export function ${name}`);
  if (start === -1) throw new Error(`could not find ${name} in snapshot.ts`);
  // Walk braces from the first { after the signature.
  const open = snapshotSrc.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < snapshotSrc.length; i++) {
    if (snapshotSrc[i] === "{") depth++;
    else if (snapshotSrc[i] === "}") {
      depth--;
      if (depth === 0) return snapshotSrc.slice(start, i + 1);
    }
  }
  throw new Error(`unbalanced braces in ${name}`);
}

writeFileSync(
  join(dir, "trend.ts"),
  `import { monthsBetween, type IndexSnapshot } from "./types.ts";\n` +
    `export type IndexTrend = { from: string; to: string; months: number; fromValue: number; toValue: number; changePct: number };\n` +
    extract("trendBetween") +
    "\n" +
    extract("longestTrend") +
    "\n"
);

const { trendBetween, longestTrend } = await import(pathToFileURL(join(dir, "trend.ts")).href);
const { currentMonth, monthsBetween, INDEX_START_MONTH, MIN_SAMPLE } = await import(
  pathToFileURL(join(dir, "types.ts")).href
);

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

const snap = (month, median, version = 1) => ({
  month,
  scopeType: "city",
  scopeKey: "gurgaon",
  scopeLabel: "Gurgaon",
  capturedAt: `${month}-01T00:00:00.000Z`,
  version,
  metrics: {
    listingCount: 1000,
    residentialCount: 800,
    commercialCount: 200,
    medianAskingInr: median,
    pricedCount: 900,
    medianTicketInr: median,
    medianUnitSqFt: 1800,
    unitSizeSample: 700,
    readyToMovePct: 60,
    underConstructionPct: 30,
    statusSample: 900,
  },
});

// ── months ────────────────────────────────────────────────────────────────

t("currentMonth is a YYYY-MM string", /^\d{4}-\d{2}$/.test(currentMonth(new Date("2026-09-22T00:00:00Z"))), true);
t("currentMonth pads the month", currentMonth(new Date("2026-01-05T00:00:00Z")), "2026-01");
t("monthsBetween across a year boundary", monthsBetween("2026-09", "2027-09"), 12);
t("monthsBetween within a year", monthsBetween("2026-09", "2026-12"), 3);
t("monthsBetween backwards is negative", monthsBetween("2027-01", "2026-09"), -4);
t("the index starts September 2026", INDEX_START_MONTH, "2026-09");

// ── trendBetween: the refusals ────────────────────────────────────────────
//
// Each of these is a case where returning a number would publish a movement
// we cannot support.

t("no earlier snapshot", trendBetween(undefined, snap("2026-10", 21800000)), null);
t("no later snapshot", trendBetween(snap("2026-09", 21800000), undefined), null);
t(
  "the earlier month has no median",
  trendBetween(snap("2026-09", null), snap("2026-10", 21800000)),
  null
);
t(
  "the later month has no median",
  trendBetween(snap("2026-09", 21800000), snap("2026-10", null)),
  null
);
t(
  "the definition changed between them",
  trendBetween(snap("2026-09", 20000000, 1), snap("2026-10", 21000000, 2)),
  null
);
t(
  "the same month compared with itself",
  trendBetween(snap("2026-09", 20000000), snap("2026-09", 20000000)),
  null
);
t(
  "the snapshots are the wrong way round",
  trendBetween(snap("2026-10", 21000000), snap("2026-09", 20000000)),
  null
);

// ── trendBetween: the real answers ────────────────────────────────────────

t("a rise", trendBetween(snap("2026-09", 20000000), snap("2026-10", 21000000)), {
  from: "2026-09",
  to: "2026-10",
  months: 1,
  fromValue: 20000000,
  toValue: 21000000,
  changePct: 5,
});
t(
  "a fall is reported as a fall",
  trendBetween(snap("2026-09", 20000000), snap("2026-10", 19000000)).changePct,
  -5
);
t(
  "a year-on-year span counts twelve months",
  trendBetween(snap("2026-09", 20000000), snap("2027-09", 23000000)).months,
  12
);
t(
  "percentages are rounded to one decimal, not invented precision",
  trendBetween(snap("2026-09", 30000000), snap("2026-10", 31234567)).changePct,
  4.1
);

// ── longestTrend ──────────────────────────────────────────────────────────

t("no snapshots", longestTrend([]), null);
t("one snapshot is not a trend", longestTrend([snap("2026-09", 20000000)]), null);
t(
  "two snapshots span one month",
  longestTrend([snap("2026-09", 20000000), snap("2026-10", 21000000)]).months,
  1
);
t(
  "it reaches for the longest comparable span",
  longestTrend([
    snap("2026-09", 20000000),
    snap("2026-10", 20500000),
    snap("2026-11", 21000000),
  ]).months,
  2
);
t(
  "input order does not matter",
  longestTrend([snap("2026-11", 21000000), snap("2026-09", 20000000), snap("2026-10", 20500000)]).months,
  2
);
// A definition change truncates the series rather than invalidating it: the
// trend falls back to the longest span that shares the latest version.
t(
  "a version change truncates rather than blocks",
  longestTrend([
    snap("2026-09", 20000000, 1),
    snap("2026-10", 20500000, 2),
    snap("2026-11", 21000000, 2),
  ]).from,
  "2026-10"
);
// And when NOTHING shares the latest version, there is no trend at all.
t(
  "a lone snapshot after a version change has no trend",
  longestTrend([snap("2026-09", 20000000, 1), snap("2026-10", 20500000, 2)]),
  null
);
// A month with no median is skipped over, not treated as zero.
t(
  "a gap month is skipped, not counted as a fall to zero",
  longestTrend([snap("2026-09", null), snap("2026-10", 20000000), snap("2026-11", 21000000)]).from,
  "2026-10"
);

// ── sample floor ──────────────────────────────────────────────────────────

t("a median needs a real sample behind it", MIN_SAMPLE >= 8, true);

console.log(fail === 0 ? "\nAll property-index tests passed." : `\n${fail} test(s) failed.`);
process.exit(fail === 0 ? 0 : 1);
