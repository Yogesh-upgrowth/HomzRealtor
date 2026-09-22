// Tests the Homz Content Standard v1 machinery.
//
// Three things here are load-bearing in a way a type signature cannot express,
// and this suite exists for them:
//
//   1. THE AUTHORSHIP RULE. "Do not falsely claim human authorship if the
//      content wasn't human-written." There must be no input that produces a
//      "Written by" line over machine-generated prose, and no path by which a
//      machine-generated page becomes publishable. If this file's authorship
//      tests ever fail, the site is lying about who wrote its analysis.
//
//   2. THE PUBLISH GATE. "Publish only at 90+." A page must not render at 89,
//      with no score, or with a score somebody forgot to record.
//
//   3. THE ANTI-SPINNING DETECTOR. The standard's own worked example — the
//      same sentence with the sector number swapped — must be caught. The
//      noun-blinding is what makes that possible and it is easy to break.
//
// Run: node --experimental-strip-types tests/content-standard.test.mjs

import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const dir = mkdtempSync(join(tmpdir(), "contentstd-test-"));
for (const name of ["types", "standard", "originality", "provenance", "rubric"]) {
  const text = readFileSync(`lib/content/editorial/${name}.ts`, "utf8").replace(
    /from "\.\/([A-Za-z]+)"/g,
    'from "./$1.ts"'
  );
  writeFileSync(join(dir, `${name}.ts`), text);
}
const load = (f) => import(pathToFileURL(join(dir, f)).href);

const { authorshipByline, isPublishable, publishedSections, PUBLISH_SCORE_THRESHOLD } =
  await load("types.ts");
const { blindNouns, similarity, bannedPhrasesIn, checkOriginality, SIMILARITY_CEILING } =
  await load("originality.ts");
const { scoreEditorialPage, wordCount, linksIn, unknownSections } = await load("rubric.ts");
const { SECTION_SPECS, editorialWordTarget, requiredWritableSections } = await load("standard.ts");
const { PLATFORM_PROVENANCE } = await load("provenance.ts");

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
const tt = (label, cond, detail = "") => {
  if (!cond) {
    fail++;
    console.log(`FAIL ${label} ${detail}`);
  } else {
    console.log(`PASS ${label}`);
  }
};

// ── 1. the authorship rule ────────────────────────────────────────────────

t(
  "machine-generated copy gets no byline at all",
  authorshipByline({ kind: "machine-generated" }),
  null
);
t(
  "a human writer gets a 'Written by' line",
  authorshipByline({ kind: "human-written", writer: "A Menon", writtenAt: "2026-09-22" }),
  { primary: "Written by A Menon", secondary: undefined }
);
tt(
  "a human EDITOR never gets a 'Written by' line",
  !authorshipByline({ kind: "human-edited", editor: "A Menon", editedAt: "2026-09-22" }).primary.startsWith(
    "Written by"
  ),
  authorshipByline({ kind: "human-edited", editor: "A Menon", editedAt: "2026-09-22" }).primary
);
tt(
  "the human-edited line says the draft came from catalogue data",
  /Drafted from HomzRealtor catalogue data/.test(
    authorshipByline({ kind: "human-edited", editor: "A Menon", editedAt: "2026-09-22" }).primary
  )
);
t(
  "a reviewer is named with their date",
  authorshipByline({
    kind: "human-written",
    writer: "A Menon",
    writtenAt: "2026-09-22",
    reviewer: "HomzRealtor Research Team",
    reviewedAt: "2026-09-22",
  }).secondary,
  "Reviewed by HomzRealtor Research Team on 22 September 2026"
);

// ── 2. the publish gate ───────────────────────────────────────────────────

const page = (over = {}) => ({
  standard: "v1",
  pageType: "sector",
  key: "sector-65",
  sections: [
    { specId: "quick-answer", heading: "H", bodyMarkdown: "Body text here.", status: "published" },
  ],
  authorship: { kind: "human-written", writer: "A Menon", writtenAt: "2026-09-22" },
  provenance: PLATFORM_PROVENANCE,
  status: "published",
  review: { scoredAt: "2026-09-22", score: 92 },
  ...over,
});

t("a published, scored, human-written page publishes", isPublishable(page()), true);
t("at exactly the threshold it publishes", isPublishable(page({ review: { scoredAt: "x", score: PUBLISH_SCORE_THRESHOLD } })), true);
t("one point below it does not", isPublishable(page({ review: { scoredAt: "x", score: PUBLISH_SCORE_THRESHOLD - 1 } })), false);
t("with no recorded score it does not", isPublishable(page({ review: undefined })), false);
t("in draft it does not", isPublishable(page({ status: "draft" })), false);
t(
  "machine-generated never publishes, whatever it scores",
  isPublishable(page({ authorship: { kind: "machine-generated" }, review: { scoredAt: "x", score: 100 } })),
  false
);
t("null is not publishable", isPublishable(null), false);
t("an unpublishable page renders no sections", publishedSections(page({ status: "draft" })), []);
t(
  "a draft section on a published page does not render",
  publishedSections(
    page({
      sections: [
        { specId: "quick-answer", heading: "H", bodyMarkdown: "Yes.", status: "published" },
        { specId: "prices", heading: "H2", bodyMarkdown: "Not ready.", status: "draft" },
      ],
    })
  ).map((s) => s.specId),
  ["quick-answer"]
);
t(
  "an empty section body does not render even when marked published",
  publishedSections(
    page({ sections: [{ specId: "quick-answer", heading: "H", bodyMarkdown: "   ", status: "published" }] })
  ),
  []
);

// ── 3. the anti-spinning detector ─────────────────────────────────────────

// The standard's own worked example.
const spun65 =
  "Sector 65 is one of Gurgaon's most sought-after residential destinations, with a median asking price of ₹2.1 Cr across 34 projects and strong connectivity to Golf Course Extension Road.";
const spun70 =
  "Sector 70 is one of Gurgaon's most sought-after residential destinations, with a median asking price of ₹1.61 Cr across 28 projects and strong connectivity to Golf Course Extension Road.";

t(
  "noun-blinding collapses the two spun sentences onto the same string",
  blindNouns(spun65) === blindNouns(spun70),
  true
);
tt(
  "so their similarity is total",
  similarity(spun65, spun70).overlap === 1,
  `overlap ${similarity(spun65, spun70).overlap}`
);
tt(
  "and that is above the ceiling",
  similarity(spun65, spun70).overlap > SIMILARITY_CEILING
);

const real65 =
  "Sector 65 sits on the Golf Course Extension corridor between 66 and 67, and its inventory is unusual for the stretch: 22 of its 34 projects are still under construction, which is why the median asking price sits below 66's despite comparable frontage.";
const real70 =
  "Sector 70 is further down Southern Peripheral Road than most buyers expect, and the practical comparison is not 69 but 70A, whose plotted inventory changes the calculation entirely for anyone weighing a builder floor.";
tt(
  "two genuinely different paragraphs stay well under the ceiling",
  similarity(real65, real70).overlap <= SIMILARITY_CEILING,
  `overlap ${similarity(real65, real70).overlap}`
);

t(
  "the banned-phrase list catches the standard's own example",
  bannedPhrasesIn(spun65).map((b) => b.id),
  ["sought-after-destination"]
);
t(
  "and the developer one",
  bannedPhrasesIn("DLF is a renowned developer known for excellence and innovation.").map((b) => b.id),
  ["renowned-developer", "excellence-and-innovation"]
);
t(
  "future price predictions are banned — analysis of present data only",
  bannedPhrasesIn("Prices here are expected to appreciate sharply next year.").map((b) => b.id),
  ["price-prediction"]
);
t(
  "'According to industry experts' is banned",
  bannedPhrasesIn("According to industry experts, the corridor is maturing.").map((b) => b.id),
  ["industry-experts"]
);
t("clean prose triggers nothing", bannedPhrasesIn(real65), []);

t(
  "checkOriginality fails a page with banned phrasing even with no siblings",
  checkOriginality(spun65, []).passes,
  false
);
t("and passes clean prose with no siblings", checkOriginality(real65, []).passes, true);

// Name blinding: two paragraphs identical but for the developer name.
const dlfPara = "DLF concentrates on Golf Course Road, where it holds more delivered stock than anyone else in the corridor by a wide margin indeed.";
const m3mPara = "M3M concentrates on Golf Course Road, where it holds more delivered stock than anyone else in the corridor by a wide margin indeed.";
tt(
  "swapping only the developer name does not make copy original",
  similarity(dlfPara, m3mPara, ["DLF", "M3M"]).overlap > SIMILARITY_CEILING,
  `overlap ${similarity(dlfPara, m3mPara, ["DLF", "M3M"]).overlap}`
);

// ── 4. the rubric ─────────────────────────────────────────────────────────

const thin = scoreEditorialPage(page());
tt("a one-paragraph page scores far below the bar", thin.total < 50, `scored ${thin.total}`);
t("and does not pass", thin.passes, false);
t(
  "no declared claims scores zero on the sourcing test, not full marks",
  thin.tests.find((x) => x.id === "claims-sourced").points,
  0
);
t(
  "no tradeoffs declared scores zero on the tradeoffs test",
  thin.tests.find((x) => x.id === "tradeoffs").points,
  0
);
tt(
  "the rubric totals exactly 100 points",
  thin.tests.reduce((n, x) => n + x.max, 0) === 100,
  String(thin.tests.reduce((n, x) => n + x.max, 0))
);
t("and there are eleven tests", thin.tests.length, 11);
t(
  "word count is worth only 5 of them",
  thin.tests.find((x) => x.id === "word-count").max,
  5
);

// A "suits" list with no disadvantages is the failure mode the standard names.
const oneSided = scoreEditorialPage(
  page({ tradeoffs: { suits: ["Buyers who want a long commute to Cyber City."], doesNotSuit: [] } })
);
t(
  "a page listing only advantages scores zero on tradeoffs",
  oneSided.tests.find((x) => x.id === "tradeoffs").points,
  0
);

// The blanket RERA claim.
const badRera = scoreEditorialPage(
  page({
    sections: [
      {
        specId: "quick-answer",
        heading: "H",
        bodyMarkdown: "DLF Limited is RERA approved across its Gurgaon portfolio.",
        status: "published",
      },
    ],
    provenance: { ...PLATFORM_PROVENANCE, reraCheckedAt: "2026-09-22" },
  })
);
t(
  "'X is RERA approved' fails the RERA test outright",
  badRera.tests.find((x) => x.id === "rera-status").points,
  0
);

// Competitor content.
const competitor = scoreEditorialPage(
  page({
    sections: [
      {
        specId: "quick-answer",
        heading: "H",
        bodyMarkdown: "As Square Yards notes, the corridor is busy.",
        status: "published",
      },
    ],
  })
);
t(
  "naming a competitor portal fails the copied-content test",
  competitor.tests.find((x) => x.id === "no-copied-content").points,
  0
);

// Broken internal links.
const badLink = scoreEditorialPage(
  page({
    sections: [
      {
        specId: "quick-answer",
        heading: "H",
        bodyMarkdown: "See [our guide](/guides/sector-65) for more.",
        status: "published",
      },
    ],
  })
);
t(
  "a link into a route family that does not exist fails the links test",
  badLink.tests.find((x) => x.id === "internal-links").points,
  0
);

// Machine-generated scoring.
const machine = scoreEditorialPage(page({ authorship: { kind: "machine-generated" } }));
t(
  "machine-generated scores zero on human review",
  machine.tests.find((x) => x.id === "human-review").points,
  0
);

// ── 5. helpers ────────────────────────────────────────────────────────────

t("word count strips markdown syntax", wordCount("**Bold** and *italic* text"), 4);
t("word count does not count link targets", wordCount("See [the rates page](/property-rates-in-gurgaon)"), 4);
t("links are extracted", linksIn("a [x](/developer/dlf) b").map((l) => l.href), ["/developer/dlf"]);

// ── 6. the frozen standard ────────────────────────────────────────────────

t(
  "a section id not in the frozen standard is reported as drift",
  unknownSections(page({ sections: [{ specId: "made-up", heading: "H", bodyMarkdown: "x", status: "draft" }] })),
  ["made-up"]
);
t("known ids are not", unknownSections(page()), []);

for (const [type, specs] of Object.entries(SECTION_SPECS)) {
  const ids = specs.map((s) => s.id);
  tt(`${type} section ids are unique`, new Set(ids).size === ids.length);
  tt(
    `${type} Layer C sections all carry a word target`,
    specs.filter((s) => s.layer === "C").every((s) => s.words && s.words.min > 0)
  );
  tt(
    `${type} Layer A/B sections carry none`,
    specs.filter((s) => s.layer !== "C").every((s) => s.words === null)
  );
  tt(`${type} has an FAQ section`, ids.includes("faqs"));
}

tt(
  "the sector word targets sum past the 2,000-word minimum",
  editorialWordTarget("sector").min >= 2000,
  String(editorialWordTarget("sector").min)
);
tt(
  "so do the developer ones",
  editorialWordTarget("developer").min >= 2000,
  String(editorialWordTarget("developer").min)
);
tt(
  "and the project ones",
  editorialWordTarget("project").min >= 2000,
  String(editorialWordTarget("project").min)
);
tt(
  "every page type has required writable sections",
  ["sector", "developer", "project"].every((x) => requiredWritableSections(x).length > 0)
);

console.log(fail === 0 ? "\nAll content-standard tests passed." : `\n${fail} test(s) failed.`);
process.exit(fail === 0 ? 0 : 1);
