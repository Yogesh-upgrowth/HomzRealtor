// Tests lib/content/postDeveloperLinks.ts — developer hub links derived from
// an article's own prose.
//
// The risk this suite exists for is specific and not hypothetical. The
// canonical builder list contains "Max", "Ace", "Puri", "Elan" and "Tata" —
// short names that are ordinary English words or their prefixes. A naive
// `includes()` would link the Max hub from any article containing "maximum",
// and the Ace hub from any article containing "place". Since the block renders
// on 25 published guides, one bad match is 25 wrong links.
//
// Run: node --experimental-strip-types tests/post-developer-links.test.mjs

import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const dir = mkdtempSync(join(tmpdir(), "postdevlinks-"));
writeFileSync(join(dir, "postDeveloperLinks.ts"), readFileSync("lib/content/postDeveloperLinks.ts", "utf8"));

const { developersMentionedIn } = await import(
  pathToFileURL(join(dir, "postDeveloperLinks.ts")).href
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

const builders = [
  { slug: "dlf", name: "DLF", count: 109 },
  { slug: "m3m", name: "M3M", count: 57 },
  { slug: "emaar", name: "Emaar", count: 55 },
  { slug: "signature-global", name: "Signature Global", count: 40 },
  { slug: "max", name: "Max", count: 6 },
  { slug: "ace", name: "Ace", count: 4 },
  { slug: "tata", name: "Tata", count: 3 },
  { slug: "ghost", name: "Ghostbuilder", count: 0 },
];

const post = (text, h1 = "A Guide") => ({
  meta: { h1 },
  sections: [{ contentMarkdown: text }],
  faqs: [],
});

const slugs = (result) => result.map((r) => r.slug);

// ── the short-name trap ───────────────────────────────────────────────────
//
// Each of these contains a builder name as a SUBSTRING of an ordinary word.
// None should produce a link.

t(
  "'maximum' does not link the Max hub",
  slugs(developersMentionedIn(post("Buyers want the maximum space for their maximum budget."), builders)),
  []
);
t(
  "'place' and 'palace' do not link the Ace hub",
  slugs(developersMentionedIn(post("A quiet place, almost a palace, in the right place."), builders)),
  []
);
t(
  "'state' and 'estate' do not link the Tata hub",
  slugs(developersMentionedIn(post("The estate market in this state, real estate overall."), builders)),
  []
);

// And the real names still match.
t(
  "'Max' as a real word links",
  slugs(developersMentionedIn(post("Max has two towers here. Max is active in Sector 65."), builders)),
  ["max"]
);
t(
  "case-insensitive",
  slugs(developersMentionedIn(post("dlf leads the corridor. DLF has 34 projects."), builders)),
  ["dlf"]
);
t(
  "a multi-word name matches",
  slugs(
    developersMentionedIn(
      post("Signature Global holds 26 projects. Signature Global built scale on the expressway."),
      builders
    )
  ),
  ["signature-global"]
);

// ── the minimum-mentions bar ──────────────────────────────────────────────

t(
  "one passing mention is not enough to be a subject",
  slugs(developersMentionedIn(post("Builders here include DLF, among others."), builders)),
  []
);
t(
  "two mentions clears it",
  slugs(developersMentionedIn(post("DLF is dominant. DLF holds 34 of them."), builders)),
  ["dlf"]
);
t(
  "the bar is configurable",
  slugs(
    developersMentionedIn(post("DLF is here."), builders, { minMentions: 1 })
  ),
  ["dlf"]
);

// ── never link a hub that does not exist ──────────────────────────────────

t(
  "a builder with zero projects is never linked",
  slugs(
    developersMentionedIn(
      post("Ghostbuilder is everywhere. Ghostbuilder again. Ghostbuilder once more."),
      builders
    )
  ),
  []
);

// ── ordering and capping ──────────────────────────────────────────────────

const busy = post(
  "DLF DLF DLF DLF leads. M3M M3M M3M follows. Emaar Emaar is third. " +
    "Signature Global Signature Global also appears."
);
t(
  "ordered by how much the article talks about each",
  slugs(developersMentionedIn(busy, builders)),
  ["dlf", "m3m", "emaar", "signature-global"]
);
t(
  "and capped",
  developersMentionedIn(busy, builders, { limit: 2 }).length,
  2
);
t("mention counts are reported", developersMentionedIn(busy, builders)[0].mentions, 4);

// ── where it reads from ───────────────────────────────────────────────────

t(
  "the h1 counts",
  slugs(
    developersMentionedIn(
      { meta: { h1: "Best DLF Projects" }, sections: [{ contentMarkdown: "DLF again." }], faqs: [] },
      builders
    )
  ),
  ["dlf"]
);
t(
  "FAQ answers count",
  slugs(
    developersMentionedIn(
      {
        meta: { h1: "A Guide" },
        sections: [{ contentMarkdown: "Nothing here." }],
        faqs: [{ q: "Who builds most?", a: "M3M does. M3M leads." }],
      },
      builders
    )
  ),
  ["m3m"]
);

// ── degenerate input ──────────────────────────────────────────────────────

t("an empty article yields nothing", slugs(developersMentionedIn(post(""), builders)), []);
t("no builders yields nothing", slugs(developersMentionedIn(post("DLF DLF DLF"), [])), []);

console.log(fail === 0 ? "\nAll post-developer-link tests passed." : `\n${fail} test(s) failed.`);
process.exit(fail === 0 ? 0 : 1);
