// Tests lib/intelligence/dataQuality.ts — the real module.
//
// Same temp-dir trick as the other suites: the module imports only a type from
// the scraping layer, which strip-types erases, so a stub satisfies it.
//
// Weighted toward the two rules that would do damage if they were wrong: that
// stripping a competitor sentence does not take the legitimate sentences
// around it, and that the classification correction never runs backwards.
//
// Run: node --experimental-strip-types tests/data-quality.test.mjs

import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const dir = mkdtempSync(join(tmpdir(), "dataquality-"));
writeFileSync(
  join(dir, "homzbackend.ts"),
  "export type RawHomzProperty = Record<string, any>;\n"
);
writeFileSync(
  join(dir, "dataQuality.ts"),
  readFileSync("lib/intelligence/dataQuality.ts", "utf8").replace(
    'from "@/lib/scraping/homzbackend"',
    'from "./homzbackend.ts"'
  )
);
const {
  classifyListing,
  competitorMentions,
  projectLooksResidential,
  sanitizeListing,
  stripCompetitorParagraphs,
  stripCompetitorProse,
} = await import(pathToFileURL(join(dir, "dataQuality.ts")).href);

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

// --- competitor prose -----------------------------------------------------

// The exact sentence the 21 Sep audit found on the M3M Latitude page, in the
// shape it appeared: surrounded by legitimate project description.
const latitude =
  "M3M Latitude is a residential project in Sector 65 Gurgaon. " +
  "Square Yards exceptional legal team can assist you with documentation. " +
  "The project offers 3 and 4 BHK apartments with modern amenities.";

t(
  "the offending sentence goes, the real ones stay",
  stripCompetitorProse(latitude),
  "M3M Latitude is a residential project in Sector 65 Gurgaon. The project offers 3 and 4 BHK apartments with modern amenities."
);

// Removing only the brand name would leave "exceptional legal team can assist
// you" attributed to us, which reads as our offer. The sentence is the
// smallest unit that can go without leaving a lie.
t(
  "no dangling offer left behind",
  /legal team/.test(stripCompetitorProse(latitude) ?? ""),
  false
);

t(
  "a paragraph that is only a competitor line returns null",
  stripCompetitorProse("Data provided by the Square Yards data intelligence team."),
  null
);
t("clean prose is returned unchanged", stripCompetitorProse("A quiet sector with good schools."), "A quiet sector with good schools.");
t("empty input", stripCompetitorProse(""), null);

t(
  "every named portal is caught",
  ["Square Yards", "MagicBricks", "99acres", "Housing.com", "NoBroker", "PropTiger", "CommonFloor"].map(
    (n) => competitorMentions(`Listed on ${n} today.`).length > 0
  ),
  [true, true, true, true, true, true, true]
);
t("spacing variants", competitorMentions("see squareyards and magic bricks"), ["Square Yards", "MagicBricks"]);

// "housing" is ordinary English in property copy — matching it bare would
// delete real sentences, so the domain is required.
t("bare 'housing' is not a competitor", competitorMentions("An affordable housing society."), []);
t("housing.com is", competitorMentions("Also on housing.com."), ["Housing.com"]);

t(
  "paragraph arrays drop only what is empty afterwards",
  stripCompetitorParagraphs([
    "Sector 65 is well connected.",
    "Brought to you by NoBroker.",
    "Possession is expected in 2027.",
  ]),
  ["Sector 65 is well connected.", "Possession is expected in 2027."]
);

// --- listing classification ----------------------------------------------

const listing = (over) => ({ propertyType: "warehouse", title: "", ...over });

t(
  "a warehouse with bedrooms is a misclassified home",
  classifyListing(listing({ bedrooms: 3, title: "3 BHK Flat in Sector 65" })).misclassified,
  true
);
t(
  "and its type is inferred from the title",
  classifyListing(listing({ bedrooms: 3, title: "3 BHK Flat in Sector 65" })).correctedType,
  "apartment"
);
t(
  "retail shop with a BHK configuration",
  classifyListing(listing({ propertyType: "retail_shop", configuration: "2 BHK" })).misclassified,
  true
);
t(
  "villa named in the title wins over the generic default",
  classifyListing(listing({ bedrooms: 4, title: "4 BHK Villa in Sector 57" })).correctedType,
  "villa"
);
t(
  "builder floor recognised",
  classifyListing(listing({ bedrooms: 3, title: "3 BHK Builder Floor, Sector 48" })).correctedType,
  "builder_floor"
);

// No residential type evidenced -> null rather than a guess. Naming it an
// apartment on no evidence would be inventing a fact to tidy a page.
t(
  "no type evidence leaves correctedType null",
  classifyListing(listing({ bedrooms: 2, title: "Spacious unit in Sector 65" })).correctedType,
  null
);

// A genuine commercial record must be left alone.
t(
  "a real warehouse is untouched",
  classifyListing(listing({ title: "Warehouse for lease, Sector 37" })).misclassified,
  false
);
t(
  "an office with no bedrooms is untouched",
  classifyListing(listing({ propertyType: "office", title: "Office space, Cyber City" })).misclassified,
  false
);

// THE ONE-WAY RULE. A residential type on a record that merely mentions
// "commercial" is not evidence of anything, and correcting it would hide the
// problem rather than fix it.
t(
  "residential type is never reclassified as commercial",
  classifyListing({
    propertyType: "apartment",
    bedrooms: 3,
    title: "3 BHK near the commercial belt",
  }).misclassified,
  false
);
t(
  "a plot is untouched",
  classifyListing({ propertyType: "plot", title: "Plot in Sector 65" }).misclassified,
  false
);

// --- sanitizeListing ------------------------------------------------------

const sanitized = sanitizeListing({
  propertyType: "warehouse",
  bedrooms: 3,
  title: "3 BHK Flat in Sector 65",
  aboutProject: ["A good home.", "Listed via MagicBricks."],
});
t("type corrected", sanitized.propertyType, "apartment");
t("isCommercial cleared", sanitized.isCommercial, false);
t("flagged for the commercial-page filter", sanitized.reclassified, "residential-in-commercial");
t("prose cleaned in the same pass", sanitized.aboutProject, ["A good home."]);

// An untouched record must be returned as-is, not cloned — the segment is
// tens of thousands of records and this runs on every cache fill.
const clean = { propertyType: "apartment", bedrooms: 2, title: "2 BHK", aboutProject: ["Nice."] };
t("clean records pass through by reference", sanitizeListing(clean) === clean, true);

// --- project residential evidence ----------------------------------------

t("BHKType is evidence", projectLooksResidential("3 BHK", "X", []), true);
t(
  "so is the project's own copy",
  projectLooksResidential(null, "M3M Latitude", ["512 spacious homes across residential towers."]),
  true
);
t(
  "and an explicit residential apartments phrase",
  projectLooksResidential(null, "X", ["A residential apartments project in Sector 65."]),
  true
);

// "residential" alone must not be enough — a commercial complex's copy
// routinely mentions the residential catchment it serves.
t(
  "a passing mention of residential catchment is not evidence",
  projectLooksResidential(null, "DLF Cyber Park", ["Close to a dense residential catchment."]),
  false
);
t("nothing to go on", projectLooksResidential(null, "", []), false);

console.log(fail === 0 ? "\nALL PASS" : `\n${fail} FAILED`);
process.exit(fail ? 1 : 0);
