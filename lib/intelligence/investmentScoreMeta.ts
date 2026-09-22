// What the Homz Investment Score is made of, declared once (2026-09-22).
//
// Checklist items 7 and 8. Item 8 asks for a permanent page explaining "exactly
// what feeds" each component, with input data, calculation logic, update
// frequency, missing-data handling and limitations, linked from every project
// page. Item 7 asks for the surrounding language to stop making investment and
// risk claims and describe the measurements instead.
//
// Both need the same facts, so they read them from here rather than from two
// hand-written copies that drift the moment buildInvestmentScore changes.
// Every `logic` string below is a description of the code in
// lib/intelligence/view-model.ts's buildInvestmentScore, and should be
// corrected whenever that function is.
//
// THE HONEST PART, and it belongs on the page rather than in a footnote: this
// score is a weighted sum of what our catalogue happens to know about a
// project. It is not a valuation, not a yield forecast, and not a comparison
// against anything transacted. A project can score well and be a poor purchase
// at its asking price, because price is deliberately not an input — we have no
// transaction data to judge a price against, so scoring one would be inventing
// a judgement we cannot support.

export const INVESTMENT_SCORE_PATH = "/homz-investment-score-methodology";

export type ScoreComponent = {
  label: string;
  max: number;
  /** The fields this reads. Named as they appear in the catalogue. */
  inputs: string[];
  /** How the points are actually assigned. Mirrors the code. */
  logic: string[];
  /** What happens when the inputs are missing. */
  missingData: string;
};

export const SCORE_COMPONENTS: ScoreComponent[] = [
  {
    label: "Developer Reputation",
    max: 20,
    inputs: ["builder (parsed from the project name)", "the canonical developer table"],
    logic: [
      "16 of 20 when the developer is on our verified list.",
      "11 of 20 when it is not.",
      "No component of this reads reviews, ratings, financials or delivery records. It is a binary on/off-list check, and 11 is not a judgement about the developer — it means we have not confirmed them.",
    ],
    missingData:
      "A project with no parseable developer name scores the lower value. It is never dropped from scoring.",
  },
  {
    label: "Connectivity",
    max: 25,
    inputs: [
      "the project's resolved coordinate (sector, micro-market or city anchor)",
      "OpenStreetMap distances to the nearest metro station, the airport and the nearest business hub",
    ],
    logic: [
      "Starts at 8 of 25.",
      "+7 when a metro station is resolvable.",
      "+6 when an airport travel time is resolvable.",
      "+4 when a business-hub travel time is resolvable.",
      "This measures whether the connection EXISTS and is resolvable, not how good it is. A project 200 m from a metro station and one 3 km away both earn the same 7.",
    ],
    missingData:
      "An unresolvable distance simply earns no points, leaving the project at the 8-point floor. Where the sector cannot be resolved at all, the coordinate falls back to the city centre and the distances are suppressed rather than shown.",
  },
  {
    label: "Social Infrastructure",
    max: 20,
    inputs: [
      "OpenStreetMap places within the catchment, in four categories: Schools, Hospitals, Shopping Centres, Restaurants",
    ],
    logic: [
      "Starts at 8 of 20.",
      "+3 per category that has at least one place in it, capped at +12.",
      "It counts categories, not places. Four schools and no hospital scores below one school and one hospital.",
    ],
    missingData:
      "A location with no OpenStreetMap coverage scores the 8-point floor. That reflects our data, not the neighbourhood.",
  },
  {
    label: "Product & Compliance",
    max: 20,
    inputs: ["the amenity list", "rera_status"],
    logic: [
      "Starts at 8 of 20.",
      "+8 for 20 or more amenities, +5 for 10 or more, +3 for any.",
      "+4 when the RERA registration is active. A lapsed or unverified registration earns nothing — it is a compliance concern, not a partial credit.",
      "Amenity counts come from the source feed and are not independently verified.",
    ],
    missingData:
      "No amenity list and no active registration leaves the 8-point floor. An absent amenity list often means the feed did not carry one, not that the project has none.",
  },
  {
    label: "Entry Timing",
    max: 15,
    inputs: ["project_status"],
    logic: [
      "14 of 15 ready to move, 12 new launch, 10 under construction, 8 when the status is unknown.",
      "Ready to move scores highest because there is no construction-completion wait and no delivery risk, not because it will appreciate more.",
    ],
    missingData:
      "An unrecognised or absent status scores the 8-point floor, and every possession-dependent module on the page is withheld rather than guessed at.",
  },
];

export const SCORE_TOTAL_POINTS = SCORE_COMPONENTS.reduce((s, c) => s + c.max, 0);

/**
 * Score bands.
 *
 * Item 7: the bands used to read "Excellent / Strong / Good / Fair", which are
 * verdicts on an investment. These describe where the number falls on our own
 * scale and nothing else. The thresholds are published on the methodology page
 * so the label carries no information the reader cannot check.
 */
export const SCORE_BANDS: { min: number; label: string }[] = [
  { min: 85, label: "Top band" },
  { min: 75, label: "Upper band" },
  { min: 65, label: "Middle band" },
  { min: 0, label: "Lower band" },
];

export function scoreBand(score: number): string {
  return SCORE_BANDS.find((b) => score >= b.min)?.label ?? "Lower band";
}

/**
 * The floor and ceiling applied to the final score.
 *
 * Stated because it materially changes how the number reads: a project cannot
 * score below 58 or above 96 whatever its inputs, so the practical range is
 * 58-96, not 0-100. Presenting "58/100" as though 0 were reachable would
 * overstate how bad a low score is.
 */
export const SCORE_FLOOR = 58;
export const SCORE_CEILING = 96;

export const SCORE_LIMITATIONS: string[] = [
  "Price is not an input. We hold asking prices, not transaction prices, so there is nothing to judge a price as fair or unfair against. A project can score well and still be expensive at what it is asking.",
  "No rental yield, appreciation rate or return is calculated anywhere in this score, and none should be inferred from it.",
  "Connectivity and social infrastructure are measured from OpenStreetMap, which is community-maintained. Coverage is uneven across Gurgaon, and a low score on a new corridor often means thin map data rather than a poor location.",
  "Developer reputation is a list membership check. It reads no reviews, complaints, financials or delivery history.",
  "Amenity counts, RERA fields and possession dates come from the source feed and are corrected but not independently verified.",
  "The score compares a project against our scoring scale, not against other projects. Two projects on 74 are not equivalent; they can reach 74 by entirely different routes.",
  "It is not financial advice, and it is not a recommendation to buy, hold or sell.",
];

export const SCORE_UPDATE_FREQUENCY =
  "Recomputed on every page build from the catalogue as it stood at that moment. The catalogue refreshes from the source feed on a 30-minute cycle, and project pages revalidate weekly, so a score reflects the data of its last rebuild — shown as the data-updated date on the page.";

/**
 * Listing scores are a different thing wearing the same name, and saying so
 * is the point.
 *
 * A project page's score is the five-factor sum above, computed here. An
 * individual listing's score (lib/intelligence/property-view.ts) is a single
 * number from the backend enrichment pipeline, with separate risk and location
 * numbers beside it — there is no factor breakdown behind it because the
 * backend does not compute one. Presenting both as "the Homz Investment Score"
 * without distinguishing them would imply a shared methodology that does not
 * exist.
 */
export const LISTING_SCORE_NOTE =
  "Individual listings carry a different score. It comes from our backend enrichment pipeline as a single number per listing, alongside separate risk and location numbers, and is not the five-factor calculation described on this page.";
