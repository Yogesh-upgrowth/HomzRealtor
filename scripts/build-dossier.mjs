#!/usr/bin/env node
// Research dossier builder — Homz Content Standard v1, workflow Step 3
// (2026-09-22).
//
// Usage: npm run build:dossier -- sector sector-65
//        npm run build:dossier -- developer dlf
//        npm run build:dossier -- sector sector-65 --stdout
//
// "Step 3 — Research dossier. I can prepare this. No prose pretending to be
//  human-written. Just: facts, sources, numbers, questions, angle, competitive
//  gaps."
//
// THE CONSTRAINT THIS SCRIPT ENFORCES ON ITSELF: it emits no sentence a writer
// could paste into a page. Every string it produces is a label, a number, a
// question or a note about the data. There is no `suggestedOpening`, no
// `draftParagraph` and no template. A writer reads this and writes; a writer
// cannot lift from it, because nothing here is shaped like copy.
//
// That is not fastidiousness. The standard's whole authorship position — "I
// should not pretend AI-written copy is human-written" — collapses the moment
// the research pack starts containing prose, because the prose gets pasted,
// lightly edited and signed. The dossier is deliberately unusable that way.
//
// WHAT IS NOT IN HERE, and why:
//
//   - Connectivity distances and nearby POIs. The standard requires VERIFIED
//     distances and "only verified places". Our OSM-derived straight-line
//     figures are computed for the live page and are a starting point, not a
//     verified fact — and the one thing a writer must not do is transcribe an
//     unverified distance into prose as a fact. So they appear here as items
//     to verify, with where to verify them, rather than as figures to quote.
//   - Any competitor's page content. Reading what ranks is research; copying
//     it is the thing the standard bans and the rubric fails a page for.
//
// Output lands in docs/editorial/dossiers/{type}-{key}.json and is not
// rendered by the site. Figures in it are a snapshot for a writer working this
// week; the site always renders the live computation.
//
// Exit codes: 0 written. 1 bad arguments or unknown key. 2 feed unreachable —
// never 0, so an unreachable feed can never be mistaken for an empty result.

import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const toStdout = process.argv.includes("--stdout");
const [pageType, key] = args;

if (!pageType || !key || !["sector", "developer"].includes(pageType)) {
  console.error("\nUsage: npm run build:dossier -- <sector|developer> <slug>");
  console.error("       npm run build:dossier -- sector sector-65");
  console.error("       npm run build:dossier -- developer dlf\n");
  console.error("Project dossiers are not built here: their order is set by Search Console");
  console.error("demand, which is not an input this repository holds.\n");
  process.exit(1);
}

const BASE = process.env.HOMZ_FEED_BASE || "https://homz-scrape.vercel.app/api/data";
const LIMIT = 25000;
const CITY = "ggn";

// ── load the real modules ───────────────────────────────────────────────────

const dir = mkdtempSync(join(tmpdir(), "dossier-"));
const copy = (src, dest, replacements = []) => {
  let text = readFileSync(src, "utf8");
  for (const [from, to] of replacements) text = text.replaceAll(from, to);
  writeFileSync(join(dir, dest), text);
};

writeFileSync(join(dir, "homzbackend.ts"), "export type RawHomzProperty = Record<string, any>;\n");
copy("lib/intelligence/dataQuality.ts", "dataQuality.ts", [
  ['from "@/lib/scraping/homzbackend"', 'from "./homzbackend.ts"'],
]);
copy("lib/intelligence/normalize.ts", "normalize.ts", [['from "./dataQuality"', 'from "./dataQuality.ts"']]);
copy("lib/intelligence/projectDedupe.ts", "projectDedupe.ts", [['from "./normalize"', 'from "./normalize.ts"']]);
copy("lib/intelligence/excludedProjects.ts", "excludedProjects.ts");
copy("lib/intelligence/projectStatus.ts", "projectStatus.ts");
copy("lib/intelligence/developerProfile.ts", "developerProfile.ts", [
  ['from "./normalize"', 'from "./normalize.ts"'],
]);
copy("lib/listings/listingLocation.ts", "listingLocation.ts", [
  ['from "@/lib/scraping/homzbackend"', 'from "./homzbackend.ts"'],
]);
copy("lib/content/developers.ts", "developers.ts", [
  ['from "@/lib/intelligence/normalize"', 'from "./normalize.ts"'],
]);
copy("lib/content/developerProfiles.ts", "developerProfiles.ts");
copy("lib/intelligence/developerViews.ts", "developerViews.ts", [
  ['from "./normalize"', 'from "./normalize.ts"'],
  ['from "./projectStatus"', 'from "./projectStatus.ts"'],
  ['from "@/lib/listings/listingLocation"', 'from "./listingLocation.ts"'],
]);
for (const name of ["types", "standard", "dossier"]) {
  copy(`lib/content/editorial/${name}.ts`, `${name}.ts`, [
    ['from "./types"', 'from "./types.ts"'],
    ['from "./standard"', 'from "./standard.ts"'],
  ]);
}

const load = (f) => import(pathToFileURL(join(dir, f)).href);
const { normalizeProject, slugify, formatInr } = await load("normalize.ts");
const { collapseDuplicateProjects } = await load("projectDedupe.ts");
const { isExcludedProject } = await load("excludedProjects.ts");
const { projectStatusKind } = await load("projectStatus.ts");
const { buildDeveloperProfile } = await load("developerProfile.ts");
const { canonicalDeveloperByName } = await load("developers.ts");
const { developerProfileFacts } = await load("developerProfiles.ts");
const { availableDeveloperViews } = await load("developerViews.ts");
const { SECTION_SPECS } = await load("standard.ts");

// ── fetch ───────────────────────────────────────────────────────────────────

async function fetchSegment(segment) {
  const res = await fetch(`${BASE}?city=${encodeURIComponent(segment)}&page=1&limit=${LIMIT}`);
  if (!res.ok) throw new Error(`upstream ${res.status} for ${segment}`);
  const json = await res.json();
  return Array.isArray(json?.results) ? json.results : [];
}

let allProjects;
try {
  const [commercial, residential] = await Promise.all([
    fetchSegment(`${CITY}CommercialProjects`),
    fetchSegment(`${CITY}ResidentialProjects`),
  ]);
  const normalized = [
    ...commercial.map((r) => normalizeProject(r, CITY, "Commercial")),
    ...residential.map((r) => normalizeProject(r, CITY, "Residential")),
  ].filter((p) => !isExcludedProject(p.city_key, p.slug));
  allProjects = collapseDuplicateProjects(normalized).projects;
} catch (err) {
  console.error(`\nCould not reach the catalogue feed: ${err.message}`);
  console.error("No dossier was built. Run this where the feed is reachable.\n");
  process.exit(2);
}

// ── shared arithmetic ───────────────────────────────────────────────────────
//
// The platform's own rule, applied here so a dossier never hands a writer a
// number the site itself would refuse to publish: no median below four priced
// records. Where the base is thin the figure is emitted with
// belongsBelowThreshold set, so the writer describes the thinness rather than
// quoting a median of two.

const MIN_PRICED = 4;

const pricedValues = (projects) =>
  projects
    .map((p) => p.min_price_inr ?? null)
    .filter((v) => typeof v === "number" && v > 0)
    .sort((a, b) => a - b);

function median(values) {
  if (values.length === 0) return null;
  const mid = Math.floor(values.length / 2);
  return values.length % 2 ? values[mid] : Math.round((values[mid - 1] + values[mid]) / 2);
}

const fig = (label, value, field, extra = {}) => ({
  label,
  display: typeof value === "number" ? formatInr(value) : value == null ? "—" : String(value),
  value: value ?? null,
  field,
  ...extra,
});

const countBy = (projects, fn) => {
  const m = new Map();
  for (const p of projects) {
    const k = fn(p);
    if (!k) continue;
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
};

const statusCounts = (projects) => {
  const kinds = { ready: 0, underConstruction: 0, newLaunch: 0, unknown: 0 };
  for (const p of projects) {
    const k = projectStatusKind(p.project_status);
    if (k === "ready-to-move") kinds.ready++;
    else if (k === "under-construction") kinds.underConstruction++;
    else if (k === "new-launch") kinds.newLaunch++;
    else kinds.unknown++;
  }
  return kinds;
};

const BUDGET_BANDS = [
  { label: "Below ₹1 Cr", min: 0, max: 10_000_000 },
  { label: "₹1–2 Cr", min: 10_000_000, max: 20_000_000 },
  { label: "₹2–4 Cr", min: 20_000_000, max: 40_000_000 },
  { label: "₹4 Cr and above", min: 40_000_000, max: Infinity },
];

const briefsFor = (type) =>
  SECTION_SPECS[type].map((s) => ({
    id: s.id,
    label: s.label,
    brief: s.brief,
    words: s.words ? `${s.words.min}–${s.words.max}` : "computed — not written",
  }));

const RERA_SOURCE = {
  label: "Haryana Real Estate Regulatory Authority (Gurugram) project search",
  url: "https://haryanarera.gov.in",
  whatToCheck:
    "Registration number and phase for every project named on the page. Registration is granted per project AND per phase; a project-level claim is wrong.",
};

const VERIFY_DISTANCES = {
  question:
    "Confirm each connectivity distance and drive time against a mapping source, on a weekday morning and an off-peak hour.",
  lookIn: ["Google Maps directions", "NHAI / HSVP route notifications for any road under construction"],
  why:
    "The site computes straight-line distance from project coordinates. That is a starting point, not a verified fact, and the standard requires straight-line and driving distance to stay distinct in the prose.",
};

// ── sector dossier ──────────────────────────────────────────────────────────

function sectorDossier(slug) {
  const projects = allProjects.filter((p) => p.sector && slugify(p.sector) === slug);
  if (projects.length === 0) return null;

  const label = projects[0].sector;
  const residential = projects.filter((p) => p.property_category === "Residential");
  const commercial = projects.filter((p) => p.property_category === "Commercial");
  const priced = pricedValues(projects);
  const status = statusCounts(projects);
  const builders = countBy(projects, (p) => p.builder && p.builder !== "Unknown" ? p.builder : null);

  const cityPriced = pricedValues(allProjects);
  const cityMedian = median(cityPriced);
  const sectorMedian = median(priced);

  const figuresBySection = {
    "quick-answer": [
      fig("Projects tracked", projects.length, "sector.projectCount"),
      fig("Residential", residential.length, "sector.residentialCount"),
      fig("Commercial", commercial.length, "sector.commercialCount"),
      fig("Median entry asking price", sectorMedian, "sector.medianEntryPrice", {
        sampleSize: priced.length,
        belowThreshold: priced.length < MIN_PRICED,
      }),
    ],
    prices: [
      fig("Median entry asking price", sectorMedian, "sector.medianEntryPrice", {
        sampleSize: priced.length,
        belowThreshold: priced.length < MIN_PRICED,
      }),
      fig("Lowest asking price", priced[0] ?? null, "sector.minPrice", { sampleSize: priced.length }),
      fig("Highest asking price", priced[priced.length - 1] ?? null, "sector.maxPrice", {
        sampleSize: priced.length,
      }),
      fig("Projects carrying a price", priced.length, "sector.pricedCount"),
      fig("Projects with no price recorded", projects.length - priced.length, "sector.unpricedCount"),
      fig(
        "Gurgaon median, for comparison",
        cityMedian,
        "city.medianEntryPrice",
        { sampleSize: cityPriced.length }
      ),
    ],
    budgets: BUDGET_BANDS.map((b) =>
      fig(
        b.label,
        projects.filter((p) => {
          const v = p.min_price_inr ?? null;
          return typeof v === "number" && v >= b.min && v < b.max;
        }).length,
        `sector.budgetBand.${b.label}`
      )
    ),
    residential: [
      fig("Residential projects", residential.length, "sector.residentialCount"),
      ...countBy(residential, (p) => p.property_type).map(([k, n]) =>
        fig(`Type: ${k}`, n, `sector.residentialType.${k}`)
      ),
    ],
    commercial: [
      fig("Commercial projects", commercial.length, "sector.commercialCount"),
      ...countBy(commercial, (p) => p.property_type).map(([k, n]) =>
        fig(`Type: ${k}`, n, `sector.commercialType.${k}`)
      ),
    ],
    "market-read": [
      fig("Ready to move", status.ready, "sector.readyCount"),
      fig("Under construction", status.underConstruction, "sector.underConstructionCount"),
      fig("New launch", status.newLaunch, "sector.newLaunchCount"),
      fig("Status not recorded", status.unknown, "sector.statusUnknownCount"),
      fig("Distinct developers active", builders.length, "sector.developerCount"),
      fig(
        "Share held by the largest developer",
        builders.length > 0 ? `${Math.round((builders[0][1] / projects.length) * 100)}% (${builders[0][0]})` : null,
        "sector.topDeveloperShare"
      ),
    ],
    developers: builders
      .slice(0, 12)
      .map(([name, n]) => fig(name, n, `sector.developer.${slugify(name)}`)),
    "major-projects": projects
      .filter((p) => (p.min_price_inr ?? 0) > 0)
      .sort((a, b) => (b.min_price_inr ?? 0) - (a.min_price_inr ?? 0))
      .slice(0, 15)
      .map((p) =>
        fig(
          `${p.project_name} — ${p.builder ?? "developer not recorded"} — ${p.project_status ?? "status not recorded"}`,
          p.min_price_inr ?? null,
          `project.${p.slug}.priceMin`
        )
      ),
  };

  // Adjacent sectors, for the comparison section. Numeric neighbours plus any
  // lettered variant of the same number — "Sector 70" against "70A" is the
  // comparison the standard names first.
  const num = parseInt(String(label).replace(/\D+/g, ""), 10);
  const neighbours = Array.from(
    new Set(
      allProjects
        .map((p) => p.sector)
        .filter((s) => {
          if (!s || slugify(s) === slug) return false;
          const n = parseInt(String(s).replace(/\D+/g, ""), 10);
          return Number.isFinite(n) && Math.abs(n - num) <= 2;
        })
    )
  ).slice(0, 8);

  figuresBySection["vs-nearby"] = neighbours.map((s) => {
    const others = allProjects.filter((p) => p.sector === s);
    const m = median(pricedValues(others));
    return fig(`${s}: ${others.length} projects, median ${m ? formatInr(m) : "—"}`, m, `sector.${slugify(s)}.medianEntryPrice`, {
      sampleSize: pricedValues(others).length,
    });
  });

  return {
    standard: "v1",
    pageType: "sector",
    key: slug,
    title: `${label}, Gurgaon`,
    generatedAt: new Date().toISOString(),
    figuresBySection,
    briefs: briefsFor("sector"),
    externalSources: [
      RERA_SOURCE,
      {
        label: "HSVP / Town and Country Planning Haryana",
        url: "https://tcpharyana.gov.in",
        whatToCheck: "Sector licensing and any development plan change affecting this sector.",
      },
      {
        label: "GMDA sector map",
        url: "https://gmda.gov.in",
        whatToCheck: "Sector boundaries and the roads that actually serve it, before describing where it sits.",
      },
    ],
    questions: [
      VERIFY_DISTANCES,
      {
        question: `Which schools, hospitals and daily-needs infrastructure genuinely serve ${label}, by name?`,
        lookIn: ["Institution websites", "Local visit or a call", "GMDA / municipal listings"],
        why: "The standard requires verified places only. A named school that does not exist is the worst error this page can carry.",
      },
      {
        question: `Is ${label} an established market or a growth-stage one, and on what evidence?`,
        lookIn: ["The ready vs under-construction split below", "Occupancy visible on the ground", "When the earliest projects here were delivered"],
        why: "Section 3 turns on this and the answer cannot be read off a count alone.",
      },
      {
        question: `Which corridor does ${label} actually belong to, as a buyer would describe it?`,
        lookIn: ["GMDA sector map", "How local listings and signage describe it"],
        why: "The corridor label drives the comparison set and the commute story.",
      },
      {
        question: `What does ${label} NOT have that a buyer comparing it against its neighbours would want?`,
        lookIn: ["The neighbour figures below", "A site visit"],
        why: "The tradeoffs section scores zero without real disadvantages, and rightly.",
      },
    ],
    competitiveGaps: [
      {
        gap: "The portals lead with inventory count and listing cards; they do not explain what the spread between the lowest and highest asking price in a sector consists of.",
        weCanAnswer: `Our catalogue holds ${priced.length} priced projects here with the full distribution, so the spread can be decomposed by type, stage and developer.`,
      },
      {
        gap: "Budget-band questions ('flats in this sector under ₹2 crore') are answered by filter pages with no explanation and often no inventory.",
        weCanAnswer: "The budget bands below are computed from live inventory, including the bands that are empty — which is itself the answer to the query.",
      },
      {
        gap: "Sector-vs-sector comparison is almost never answered on a sector page; it is spread across forum threads.",
        weCanAnswer: "Adjacent-sector medians and counts are below, computed on the same basis, so the comparison is like-for-like.",
      },
    ],
    dataWarnings: [
      ...(priced.length < MIN_PRICED
        ? [`Only ${priced.length} priced projects — below the platform's own four-record threshold. Do not quote a median; describe the thinness.`]
        : []),
      ...(status.unknown > projects.length / 3
        ? [`${status.unknown} of ${projects.length} projects have no recorded status. The stage mix is not reliable enough to lead with.`]
        : []),
      ...(projects.length - priced.length > priced.length
        ? [`More projects without a price (${projects.length - priced.length}) than with one (${priced.length}). Say so rather than implying the median covers the sector.`]
        : []),
    ],
    angle: [
      `${projects.length} projects: ${residential.length} residential, ${commercial.length} commercial.`,
      `Stage mix — ready ${status.ready}, under construction ${status.underConstruction}, new launch ${status.newLaunch}.`,
      builders.length > 0
        ? `Developer concentration — ${builders.length} developers, largest holds ${builders[0][1]} (${builders[0][0]}).`
        : "No developer attributed to any project here.",
      sectorMedian && cityMedian
        ? `Median sits ${sectorMedian > cityMedian ? "above" : "below"} the Gurgaon median (${formatInr(sectorMedian)} vs ${formatInr(cityMedian)}).`
        : "Median not computable against the city figure.",
    ],
  };
}

// ── developer dossier ───────────────────────────────────────────────────────

function developerDossier(slug) {
  const projects = allProjects.filter((p) => {
    if (!p.builder || p.builder === "Unknown") return false;
    const canonical = canonicalDeveloperByName(p.builder);
    return (canonical ? canonical.id : slugify(p.builder)) === slug;
  });
  if (projects.length === 0) return null;

  const canonical = canonicalDeveloperByName(projects[0].builder);
  const name = canonical ? canonical.canonicalName : projects[0].builder;
  const profile = buildDeveloperProfile(projects, () => "gurgaon");
  const facts = developerProfileFacts(slug);
  const views = availableDeveloperViews(projects);
  const priced = pricedValues(projects);
  const sectors = countBy(projects, (p) => p.sector);

  return {
    standard: "v1",
    pageType: "developer",
    key: slug,
    title: name,
    generatedAt: new Date().toISOString(),
    figuresBySection: {
      "quick-answer": [
        fig("Projects in the catalogue", projects.length, "developer.projectCount"),
        fig("Residential", projects.filter((p) => p.property_category === "Residential").length, "developer.residentialCount"),
        fig("Commercial", projects.filter((p) => p.property_category === "Commercial").length, "developer.commercialCount"),
        fig("Median entry asking price", median(priced), "developer.medianEntryPrice", {
          sampleSize: priced.length,
          belowThreshold: priced.length < MIN_PRICED,
        }),
      ],
      "price-analysis": [
        fig("Projects carrying a price", priced.length, "developer.pricedCount"),
        fig("Lowest asking price", priced[0] ?? null, "developer.minPrice"),
        fig("Highest asking price", priced[priced.length - 1] ?? null, "developer.maxPrice"),
        fig("Median entry asking price", median(priced), "developer.medianEntryPrice", {
          sampleSize: priced.length,
        }),
      ],
      footprint: sectors
        .slice(0, 20)
        .map(([s, n]) => fig(s, n, `developer.sector.${slugify(s)}`)),
      // microMarkets is the catalogue's corridor-level grouping — Golf Course
      // Road, Dwarka Expressway, New Gurgaon and so on — which is exactly the
      // cut this section is about.
      "by-corridor": (profile.microMarkets ?? []).map((l) =>
        fig(l.name, l.count, `developer.corridor.${slugify(l.name)}`)
      ),
      "residential-portfolio": (profile.types ?? []).map((t) =>
        fig(`Type: ${t.label}`, t.count, `developer.type.${slugify(t.label)}`)
      ),
      // From buildDeveloperProfile, not recomputed here, so the dossier and the
      // live hub never disagree about the same developer's stage mix.
      pipeline: [
        fig("New launch", profile.newLaunch, "developer.newLaunch"),
        fig("Under construction", profile.underConstruction, "developer.underConstruction"),
      ],
      "ready-inventory": [
        fig("Ready to move", profile.readyToMove, "developer.readyToMove"),
        fig("Status not recorded", profile.statusUnknown, "developer.statusUnknown"),
      ],
      // Two different numbers, kept apart deliberately: a well-formed
      // registration id is not the same thing as a live registration, and the
      // page already refuses to conflate them (see ReraBadge).
      rera: [
        fig("Projects carrying any registration id", profile.reraWithId, "developer.reraWithId"),
        fig("Projects with an ACTIVE registration", profile.reraActive, "developer.reraActive"),
        fig(
          "Projects with no registration recorded",
          projects.length - profile.reraWithId,
          "developer.reraMissingCount"
        ),
      ],
      "notable-projects": projects
        .filter((p) => (p.min_price_inr ?? 0) > 0)
        .sort((a, b) => (b.min_price_inr ?? 0) - (a.min_price_inr ?? 0))
        .slice(0, 20)
        .map((p) =>
          fig(
            `${p.project_name} — ${p.sector ?? "sector not recorded"} — ${p.project_status ?? "status not recorded"}`,
            p.min_price_inr ?? null,
            `project.${p.slug}.priceMin`
          )
        ),
    },
    briefs: briefsFor("developer"),
    externalSources: [
      RERA_SOURCE,
      facts
        ? {
            label: `${facts.officialName} official site`,
            url: facts.officialWebsite,
            whatToCheck: `Already recorded in lib/content/developerProfiles.ts, last checked ${facts.lastVerifiedAt}. Re-check before publishing.`,
          }
        : {
            label: `${name} official website`,
            url: "",
            whatToCheck:
              "NOT YET RECORDED. Find the official site, read it, and add the verified entity facts to lib/content/developerProfiles.ts BEFORE writing the About section. Until then the page renders no About section, which is correct.",
          },
      {
        label: "Corporate filings (BSE/NSE or MCA), where the developer is listed",
        url: "https://www.mca.gov.in",
        whatToCheck: "Founding year, registered office and corporate structure, where the official site is vague.",
      },
    ],
    questions: [
      {
        question: `When did ${name} become active in Gurgaon specifically, and what was the first project?`,
        lookIn: ["The developer's own site", "RERA registrations by date", "Contemporary press"],
        why: "The 'history in Gurgaon' section is what makes this page Gurgaon-specific rather than a rewritten corporate About page.",
      },
      {
        question: `Why does the portfolio concentrate where it does?`,
        lookIn: ["The sector and corridor counts below", "Land acquisition history where it is public"],
        why: "The footprint section is our own research, and a table with no explanation is not research.",
      },
      {
        question: `Has the product mix changed — for instance from plotted or mid-market to luxury?`,
        lookIn: ["The price distribution below, read against project launch dates"],
        why: "A range from lakhs to tens of crores needs a reason attached, and it is usually this.",
      },
      {
        question: `Which ${name} projects have known delivery or litigation history a buyer should know about?`,
        lookIn: ["RERA orders", "Consumer forum / NCLT records", "Court reporting"],
        why: "The tradeoffs section needs real disadvantages, and on a developer page this is where they are.",
      },
      VERIFY_DISTANCES,
    ],
    competitiveGaps: [
      {
        gap: "Developer pages on the portals are a filtered project list with a boilerplate paragraph.",
        weCanAnswer: `We hold ${projects.length} of their projects with sector and corridor attribution, so the footprint can be described as a shape rather than a count.`,
      },
      {
        gap: "Nobody explains the price range on a developer page; it is printed as a span from the cheapest to the dearest.",
        weCanAnswer: "The distribution below decomposes by category, stage and location, so the span can be explained instead of stated.",
      },
      {
        gap: "'Is this developer RERA approved' is answered wrongly almost everywhere, because registration is per project and per phase.",
        weCanAnswer: "We hold registration presence per project and can state the position correctly, which is also the more useful answer.",
      },
    ],
    dataWarnings: [
      ...(facts ? [] : [`No verified entity facts for ${name}. The About section will not render until they are added, and must not be written from memory.`]),
      ...(priced.length < MIN_PRICED
        ? [`Only ${priced.length} priced projects — below the four-record threshold. Do not quote a median.`]
        : []),
      ...(profile.statusUnknown > projects.length / 3
        ? [`${profile.statusUnknown} of ${projects.length} projects have no recorded status.`]
        : []),
    ],
    angle: [
      `${projects.length} projects, ${views.filter((v) => v.indexable).length} of ${views.length} child views indexable.`,
      `Stage mix — ready ${profile.readyToMove}, under construction ${profile.underConstruction}, new launch ${profile.newLaunch}.`,
      sectors.length > 0
        ? `Sector concentration — ${sectors.length} sectors, largest is ${sectors[0][0]} with ${sectors[0][1]}.`
        : "No sector attributed to any project.",
      facts ? `Entity facts verified ${facts.lastVerifiedAt} from ${facts.officialWebsite}.` : "Entity facts NOT verified.",
    ],
  };
}

// ── run ─────────────────────────────────────────────────────────────────────

const dossier = pageType === "sector" ? sectorDossier(key) : developerDossier(key);

if (!dossier) {
  console.error(`\nNo ${pageType} matching "${key}" in the catalogue.`);
  console.error(
    pageType === "sector"
      ? "Sector keys are the catalogue's own slug, e.g. sector-65, sector-37d.\n"
      : "Developer keys are the canonical slug, e.g. dlf, m3m, signature-global.\n"
  );
  process.exit(1);
}

if (toStdout) {
  console.log(JSON.stringify(dossier, null, 2));
  process.exit(0);
}

const out = `docs/editorial/dossiers/${pageType}-${key}.json`;
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(dossier, null, 2) + "\n");

console.log(`\nDossier written: ${out}`);
console.log(`${dossier.title} — ${Object.keys(dossier.figuresBySection).length} sections with figures, ${dossier.questions.length} open questions.`);
if (dossier.dataWarnings.length > 0) {
  console.log(`\nData warnings (fix these in the DATA before anyone writes around them):`);
  for (const w of dossier.dataWarnings) console.log(`  - ${w}`);
}
console.log(
  `\nThis is research, not a draft. It contains no prose. The narrative is written by a\n` +
    `person from these facts — see docs/seo/content-standard-v1.md, workflow Step 4.\n`
);
