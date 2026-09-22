// Tests the homepage news allow-list in lib/intelligence/news.ts.
//
// Checklist item 12. This filter decides what appears on the homepage, so
// both directions of failure are visible to every visitor: a crime story
// under "Latest News" on a property site, or a real Dwarka Expressway story
// silently dropped. Neither shows up in a build or a type check, so it gets
// tests.
//
// news.ts reads process.env and imports ./view-model for clean(), so the
// module is copied out with that one import replaced by a local stub —
// classifyHeadline touches none of it.
//
// Run: node --experimental-strip-types tests/news-topics.test.mjs

import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const dir = mkdtempSync(join(tmpdir(), "newstopics-"));
writeFileSync(
  join(dir, "view-model.ts"),
  "export function clean(v: unknown): string | null {\n" +
    "  const s = typeof v === 'string' ? v.trim() : '';\n" +
    "  return s.length > 0 ? s : null;\n" +
    "}\n"
);
writeFileSync(
  join(dir, "news.ts"),
  readFileSync("lib/intelligence/news.ts", "utf8").replace(
    'from "./view-model"',
    'from "./view-model.ts"'
  )
);

const { classifyHeadline, NEWS_TOPICS } = await import(pathToFileURL(join(dir, "news.ts")).href);

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

// ── the topics the checklist named must all be reachable ──────────────────

const NAMED = [
  "Gurgaon Real Estate",
  "Gurgaon Infrastructure",
  "Dwarka Expressway",
  "Golf Course Extension Road",
  "New Gurgaon",
  "HARERA",
  "Gurgaon Metro",
  "RRTS",
  "Developer News",
  "Project Launches",
  "Housing Finance",
  "Office Leasing",
  "Property Regulation",
];
const labels = new Set(NEWS_TOPICS.map((t) => t.label));
t(
  "every category the checklist named exists",
  NAMED.filter((n) => !labels.has(n)),
  []
);

// ── admitted ──────────────────────────────────────────────────────────────

t(
  "Dwarka Expressway story",
  classifyHeadline("Dwarka Expressway stretch opens to traffic, easing the Gurgaon commute"),
  "Dwarka Expressway"
);
t(
  "GCE Road story",
  classifyHeadline("Golf Course Extension Road sees fresh luxury supply this quarter"),
  "Golf Course Extension Road"
);
t("New Gurgaon story", classifyHeadline("New Gurgaon emerges as the value corridor"), "New Gurgaon");
t(
  "HARERA ruling",
  classifyHeadline("HARERA orders builder to refund homebuyers with interest"),
  "HARERA"
);
t(
  "RERA spelled out",
  classifyHeadline("Real Estate Regulatory Authority tightens registration norms"),
  "HARERA"
);
t(
  "Gurgaon metro",
  classifyHeadline("Gurugram metro extension gets cabinet approval"),
  "Gurgaon Metro"
);
t("RRTS", classifyHeadline("Namo Bharat corridor work picks up pace"), "RRTS");
t(
  "housing finance",
  classifyHeadline("Home loan rates fall after the RBI repo rate cut"),
  "Housing Finance"
);
t(
  "office leasing",
  classifyHeadline("Grade A office leasing in Gurugram hits a record this quarter"),
  "Office Leasing"
);
t(
  "property regulation",
  classifyHeadline("Haryana revises circle rates across Gurugram sectors"),
  "Property Regulation"
);
t(
  "project launch",
  classifyHeadline("Signature Global unveils a new residential project in Sector 71"),
  "Project Launches"
);
t(
  "developer news",
  classifyHeadline("DLF reports higher bookings on strong demand"),
  "Developer News"
);
t(
  "gurgaon infrastructure",
  classifyHeadline("Gurugram underpass on NH-48 to open next month"),
  "Gurgaon Infrastructure"
);
t(
  "gurgaon real estate generally",
  classifyHeadline("Gurugram residential property prices hold steady, say brokers"),
  "Gurgaon Real Estate"
);
t(
  "national real estate backfill",
  classifyHeadline("Indian housing sales rise across the top seven cities"),
  "Indian Real Estate"
);

// ── excluded: the categories the checklist named ──────────────────────────
//
// Each of these WOULD have matched the old real-estate vocabulary regex,
// which is exactly why they are here.

t(
  "crime in a residential context",
  classifyHeadline("Man murdered inside a Gurugram apartment complex, police say"),
  null
);
t(
  "property fraud crime story",
  classifyHeadline("Builder arrested for duping homebuyers of Rs 50 crore in Gurugram"),
  null
);
t(
  "robbery at a property",
  classifyHeadline("Robbery at a Gurugram builder floor, cash and jewellery looted"),
  null
);
t(
  "celebrity property purchase",
  classifyHeadline("Bollywood actor buys a Rs 40 crore apartment in Mumbai"),
  null
);
t(
  "cricketer property purchase",
  classifyHeadline("Cricketer sells his Gurugram villa for Rs 12 crore"),
  null
);
t(
  "sensational framing",
  classifyHeadline("Shocking: Gurugram property prices in freefall, say experts"),
  null
);
t("viral content", classifyHeadline("Watch: viral video of a Gurugram highrise lift"), null);
t(
  "generic Delhi news with no property topic",
  classifyHeadline("Delhi air quality dips to severe as winter sets in"),
  null
);
t(
  "unrelated national story",
  classifyHeadline("Parliament passes the finance bill after a long debate"),
  null
);
t(
  "sport, which mentions nothing property",
  classifyHeadline("India beat Australia by six wickets in Ahmedabad"),
  null
);
t("empty input", classifyHeadline(""), null);

// The blocked check must run BEFORE the allow-list, or a crime story carrying
// property vocabulary slips through on the vocabulary alone. This is the
// ordering assertion, stated as a case rather than left implicit.
t(
  "blocked wins over an allow-list match in the same headline",
  classifyHeadline("DLF tower resident stabbed to death, police arrest neighbour"),
  null
);

console.log(fail === 0 ? "\nAll news-topic tests passed." : `\n${fail} test(s) failed.`);
process.exit(fail === 0 ? 0 : 1);
