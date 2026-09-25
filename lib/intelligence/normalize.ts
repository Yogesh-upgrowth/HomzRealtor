// Normalizes raw homzbackend API records into structured project data.
// Mirrors scripts/lib/normalize.mjs but as TypeScript for use in server components.

import {
  projectLooksResidential,
  stripCompetitorDeep,
  stripCompetitorParagraphs,
  stripCompetitorProse,
} from "./dataQuality";

export const CITY_META: Record<string, { name: string; state: string }> = {
  ggn: { name: "Gurgaon", state: "Haryana" },
  delhi: { name: "Delhi", state: "Delhi" },
  faridabad: { name: "Faridabad", state: "Haryana" },
  gNoida: { name: "Greater Noida", state: "Uttar Pradesh" },
  noida: { name: "Noida", state: "Uttar Pradesh" },
};

export const KNOWN_BUILDERS = [
  "Signature Global", "Smart World", "Central Park", "Anant Raj", "Hero Homes",
  "County Group", "Trump Towers", "M3M", "DLF", "Godrej", "Tata", "Sobha",
  "Birla", "Adani", "Emaar", "Bestech", "Ireo", "Vatika", "Conscient", "Puri",
  "Experion", "Whiteland", "Krisumi", "Elan", "AIPL", "Paras", "Trevoc",
  "ATS", "Gaur", "Gaursons", "Mahagun", "Eldeco", "Prateek", "Supertech",
  "Sikka", "Bhutani", "Saya", "Tarc", "BPTP", "Pioneer", "Raheja", "Ambience",
  "Microtek", "Max", "Ace", "Spaze", "Orris", "Ansal", "Unitech", "Indiabulls",
  "Pyramid", "Ninex", "ROF", "Adore", "SS Group", "Brisk",
];

// SEO audit 2026-09-07 P0 ("Some project copy... retains Square Yards
// wording"): the feed's free-text fields (aboutProject, builderDescription)
// sometimes include the provider's own disclosure sentence verbatim, e.g.
// "*This data is derived by the Square Yards data intelligence team...*"
// on Emaar Serenity Hills — confirmed live. Rather than editing/replacing
// that copy (which would mean writing new marketing prose without a real
// source), this drops only the offending text, keeping everything else the
// feed provided untouched.
//
// 2026-09-21: widened twice, after the 21 Sep audit found
// "Square Yards exceptional legal team can assist you..." still rendering
// inside the M3M Latitude description.
//
//   - From one pattern to the full competitor set (MagicBricks, 99acres,
//     Housing.com, NoBroker, PropTiger, CommonFloor and the rest), which is
//     the sitewide sweep that audit asked for. The old single pattern only
//     ever caught one of the sources this catalogue aggregates.
//   - From dropping the whole paragraph to dropping only the sentences that
//     name a competitor. A paragraph is usually several sentences of
//     legitimate project description plus one stray line; discarding all of
//     it lost real content, and that loss is very likely why the "legal team"
//     sentence survived — it sat in a paragraph whose other sentences were
//     worth keeping, so a paragraph-level filter could not remove it without
//     removing them.
//
// See lib/intelligence/dataQuality.ts for the patterns and for why the
// sentence is the smallest safe unit to remove.
function stripSyndicatedText(paragraphs: string[]): string[] {
  return stripCompetitorParagraphs(paragraphs);
}

// DEV-02 (2026-09-16): confirmed live — ATS Triumph Villas' aboutProject
// narrative states "...is registered under GGM/1051/783/2026/23" while the
// same record's own structured rera_id field is a completely different
// number ("RERA-GRG-2073-2025"), rendered separately with its own verified
// rera_status handling. Which one is actually correct is a regulatory
// lookup, not something a parser can decide (see the handoff's owner-input
// queue) — so rather than guess, this strips only the embedded
// registration-number clause from free text. The app already has one
// dedicated, status-aware place to assert a registration number; prose
// shouldn't assert a second, unverified one alongside it.
const EMBEDDED_REGULATORY_ID_RE = /\s*(?:and\s+)?is registered under\s+[A-Z0-9/-]+\.?/gi;

export function redactEmbeddedRegulatoryIds(paragraphs: string[]): string[] {
  return paragraphs.map((p) =>
    p
      .replace(EMBEDDED_REGULATORY_ID_RE, ".")
      .replace(/\.\s*\./g, ".")
      .replace(/\s{2,}/g, " ")
      .trim()
  );
}

// Audit item 9 (2026-09-19): the fallback below used to be
// `title.split(/\s+/)[0]`, i.e. the first word of the project title, with no
// check that it was a builder name at all. That produced developer hubs at
// /developer/the (34 projects), /old, /good, /golden, /royal, /sharma,
// /trump, /huda and /rwa, and is a large part of why 140 of 254 hubs held a
// single project. A junk hub is worse than no hub: it is a thin indexable
// page asserting a developer that does not exist.
//
// A first word is only accepted now when it could plausibly be a company
// name. Everything else returns "Unknown", and buildDeveloperIndex() drops
// those rather than minting a hub for them.
const BUILDER_STOPWORDS = new Set([
  "the", "a", "an", "new", "old", "good", "best", "golden", "royal", "luxury",
  "premium", "green", "sector", "plot", "plots", "flat", "flats", "apartment",
  "apartments", "villa", "villas", "house", "home", "homes", "floor", "floors",
  "builder", "independent", "residential", "commercial", "affordable", "huda",
  "rwa", "society", "project", "property", "land", "shop", "office", "sale",
  "rent", "my", "your", "our", "prime", "grand", "elite",
]);

// Same company, two spellings in the feed. Merging them stops one developer
// being split across two hubs, each too thin to rank.
const BUILDER_ALIASES: Record<string, string> = {
  signature: "Signature Global",
  "signature global": "Signature Global",
  uppal: "Uppal",
  uppals: "Uppal",
  gpl: "Godrej Properties",
  godrej: "Godrej Properties",
  "godrej properties": "Godrej Properties",
  dwarkadhis: "Dwarkadhis",
  dwarkadhish: "Dwarkadhis",
};

function canonicalBuilder(name: string): string {
  return BUILDER_ALIASES[name.trim().toLowerCase()] ?? name.trim();
}

export function extractBuilder(projectTitle: string): string {
  const title = (projectTitle || "").trim();
  if (!title) return "Unknown";

  for (const b of KNOWN_BUILDERS) {
    if (title.toLowerCase().startsWith(b.toLowerCase())) return canonicalBuilder(b);
  }

  const words = title.split(/\s+/).filter(Boolean);

  // Try a two-word prefix before a one-word one -- "Signature Global" and
  // "Godrej Properties" are the company; "Signature" and "Godrej" alone are
  // the ones that split a developer across two hubs.
  const pair = words.slice(0, 2).join(" ").toLowerCase();
  if (BUILDER_ALIASES[pair]) return BUILDER_ALIASES[pair];

  const first = words[0] || "";
  const lower = first.toLowerCase().replace(/[^a-z]/g, "");
  if (
    lower.length < 3 ||
    BUILDER_STOPWORDS.has(lower) ||
    /^\d+$/.test(first)
  ) {
    return "Unknown";
  }
  return canonicalBuilder(first);
}

// Audit item 8 (2026-09-19): this pulled "Sector N" out of free text with no
// regard for which town the sector belongs to, so Sohna's sector numbering
// merged into Gurgaon's -- LID Plaza, in Sector 6 Sohna, was filed under
// Sector 6 Gurgaon -- and a "Sector 150", which is Noida, appeared under
// Gurgaon too. Both produce a sector hub that mixes unrelated inventory.
//
// Gurgaon's sectors run 1-115 (plus letter suffixes). A number outside that
// range, or a sector qualified by another town's name in the same text, is
// not a Gurgaon sector and returns null rather than contaminating a hub.
const GURGAON_MAX_SECTOR = 115;
// "Sohna Road" is a Gurgaon corridor and appears in MICRO_MARKETS above --
// "Sector 48, Sohna Road, Gurgaon" is a genuine Gurgaon sector. Only the town
// of Sohna (its own sector numbering) disqualifies, hence the lookahead.
const OTHER_TOWNS = /\b(sohna(?!\s+road)|manesar|bhiwadi|dharuhera|pataudi|farukh?nagar|noida|faridabad|delhi)\b/i;

export function extractSector(...texts: (string | string[] | null | undefined)[]): string | null {
  const blob = texts.flatMap((t) => (Array.isArray(t) ? t : [t])).filter(Boolean).join(" ");
  const m = blob.match(/\bSector\s*-?\s*([0-9]{1,3}[A-Za-z]?)\b/i);
  if (!m) return null;

  const raw = m[1].toUpperCase();
  const num = parseInt(raw, 10);
  if (!Number.isFinite(num) || num < 1 || num > GURGAON_MAX_SECTOR) return null;

  // "Sector 6, Sohna" is Sohna's Sector 6, not Gurgaon's. Only reject when the
  // other town is named near the sector mention, so a project that merely
  // lists "30 min to Noida" under connectivity is unaffected.
  const around = blob.slice(Math.max(0, m.index! - 40), (m.index ?? 0) + m[0].length + 40);
  if (OTHER_TOWNS.test(around)) return null;

  return `Sector ${raw}`;
}

const MICRO_MARKETS = [
  "Dwarka Expressway", "Golf Course Extension Road", "Golf Course Road",
  "Southern Peripheral Road", "Sohna Road", "New Gurgaon", "MG Road",
  "Yamuna Expressway", "Noida Extension", "Greater Noida West", "Yeida",
  "Najafgarh Road", "NH-48", "NH-8", "NH-24",
];

export function extractMicroMarket(...texts: (string | string[] | null | undefined)[]): string | null {
  const blob = texts.flatMap((t) => (Array.isArray(t) ? t : [t])).filter(Boolean).join(" ");
  for (const mm of MICRO_MARKETS) {
    if (blob.toLowerCase().includes(mm.toLowerCase())) return mm;
  }
  return null;
}

function parseAmounts(text: string | null | undefined): number[] {
  if (!text) return [];
  const out: number[] = [];
  const re = /([\d]+(?:\.\d+)?)\s*(cr(?:ore)?s?|lakh?s?|lac?s?|l|k)\b/gi;
  let m;
  while ((m = re.exec(text)) !== null) {
    const value = parseFloat(m[1]);
    const unit = m[2].toLowerCase();
    let mult = 1;
    if (unit.startsWith("cr")) mult = 1e7;
    else if (unit.startsWith("lakh") || unit.startsWith("lac") || unit === "l") mult = 1e5;
    else if (unit === "k") mult = 1e3;
    out.push(Math.round(value * mult));
  }
  return out;
}

export function extractPriceRange(priceText?: string | null, priceList?: any[] | null) {
  let amounts = parseAmounts(priceText);
  if (amounts.length === 0 && Array.isArray(priceList)) {
    for (const p of priceList) amounts.push(...parseAmounts(p?.price));
  }
  amounts = amounts.filter((n) => n > 0);
  if (amounts.length === 0) return { min: null, max: null };
  return { min: Math.min(...amounts), max: Math.max(...amounts) };
}

// DEV-02 (2026-09-16): this used to only extract the numeric value from the
// feed's free-text size field, and normalizeProject() then hardcoded
// size_unit to "sq.ft" whenever any size text was present at all --
// silently mislabeling a project actually measured in Sq.Yd (real property
// listings in this same feed use that unit, e.g. "...-267-sqyd-apartment"),
// Sq.M or acres. A basis this codebase can't confirm (no unit detected in
// the text) now surfaces as size_unit: null rather than a guessed "sq.ft" --
// "Area not confirmed" is the honest fallback, not a fabricated one.
// Exported 2026-09-21 for the listing location hubs: they compute a per-sq-ft
// rate from the listings' own `size` strings, and need the same
// confirmed-unit-or-nothing rule rather than a second implementation of it.
export function detectAreaUnit(text: string): string | null {
  if (/sq\.?\s*yd|sqyd|sq\.?\s*yard|square\s*yard/i.test(text)) return "sq.yd";
  if (/sq\.?\s*m(?:eter|etre)?s?\b|sqm\b|square\s*met/i.test(text)) return "sq.m";
  if (/sq\.?\s*ft|sqft|square\s*fee?t/i.test(text)) return "sq.ft";
  if (/\bacres?\b/i.test(text)) return "acre";
  return null;
}

// R19-04 (2026-09-19). DEV-02 already found that some scraped values carry an
// entire unit-selector dropdown's option list appended to the real value, e.g.
// "1350 sqft sqft sqyrd sqm acre bigha hectare marla kanal biswa1 biswa2
// ground aankadam rood chatak kottah marla cent perch guntha are katha gaj
// killa kuncham ₹ 56/sqft" instead of "1350 sqft". That fix was applied only
// to the `specifications` rows; the same contamination also reaches
// `property.size`, which feeds the area chip, the listing cards and the meta
// description, and it silently corrupts extractSizeRange() below:
//   - detectAreaUnit() tests sq.m before sq.ft, so the dump's "sqm" token wins
//     and a sq.ft listing is relabelled "sq.m";
//   - the digit scan picks up "biswa1"/"biswa2" and the trailing "₹ 56/sqft"
//     rate, so min/max come from tokens that are not areas at all.
// Hence one shared detector here (normalize.ts is the leaf module both
// view-model.ts and property-view.ts can import without a cycle).
const UNIT_SELECTOR_TOKENS = [
  "sqft", "sqyd", "sqyrd", "sqyard", "sqm", "acre", "bigha", "hectare", "marla", "kanal",
  "biswa", "ground", "aankadam", "rood", "chatak", "kottah", "cent", "perch",
  "guntha", "katha", "gaj", "killa", "kuncham",
];

export function looksLikeUnitSelectorDump(value: string): boolean {
  // SEO audit 2026-09-25 (B7 unitSelectorDump): "1350 Sq.Ft. Sq.ft. Sq.metre
  // Sq.yards" slipped through because the tokens are spelled without dots or
  // spaces. Collapse "sq. ft" / "sq-ft" / "sq.metre" to "sqft" / "sqmetre"
  // first so the checks below see one spelling per unit.
  const lower = String(value ?? "")
    .toLowerCase()
    .replace(/\bsq[.\s-]*(?=[a-z])/g, "sq")
    .replace(/\./g, "");
  let distinctHits = 0;
  for (const token of UNIT_SELECTOR_TOKENS) {
    if (lower.includes(token)) distinctHits++;
    // A real value never legitimately names 2+ different land/area units.
    // DEV-02 used 3; lowered to 2 because "1350 sqft sqyrd" is already
    // corrupt and the 3-token threshold let shorter dumps through.
    if (distinctHits >= 2) return true;
  }
  // The same unit repeated ("1350 sqft sqft") is a dump even at one distinct
  // token — a genuine value never restates its own unit.
  return UNIT_SELECTOR_TOKENS.some(
    (t) => lower.split(t).length - 1 >= 2
  );
}

// Salvage the leading "<number> <unit>" from a contaminated area string.
// The dump is always appended *after* the real value, so the leading pair is
// the one part that can be confirmed. Returns null when even that can't be
// read, so callers omit the field rather than show a fabricated one.
export function salvageAreaText(value?: string | null): string | null {
  if (!value) return null;
  const text = String(value).trim();
  if (!looksLikeUnitSelectorDump(text)) return text;
  const match = text.match(
    /^(\d+(?:[.,]\d+)?)\s*(sq\.?\s*ft|sqft|square\s*fee?t|sq\.?\s*yd|sqyd|square\s*yard|sq\.?\s*m(?:eter|etre)?s?|sqm|acres?)\b/i
  );
  if (!match) return null;
  return `${match[1]} ${match[2]}`.replace(/\s+/g, " ").trim();
}

export function extractSizeRange(sizeText?: string | null): {
  min: number | null;
  max: number | null;
  unit: string | null;
} {
  if (!sizeText) return { min: null, max: null, unit: null };
  // Parse the salvaged value, never the raw dump — otherwise the unit and the
  // min/max below are both read off the dropdown's option list.
  const text = salvageAreaText(String(sizeText));
  if (!text) return { min: null, max: null, unit: null };
  const unit = detectAreaUnit(text);
  const nums = (text.match(/\d+(?:\.\d+)?/g) || []).map(Number);
  if (nums.length === 0) return { min: null, max: null, unit };
  return { min: Math.min(...nums), max: Math.max(...nums), unit };
}

// Exact rupees with Indian grouping, e.g. 68543 → "₹68,543". Use for monthly /
// small amounts (EMI, rent, maintenance) where Lakh/Cr rounding loses meaning.
export function formatInrExact(n: number | null | undefined): string | null {
  if (n == null) return null;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

// Short Lakh/Cr formatting for large amounts (property prices, totals). Keeps
// meaningful precision for sub-crore values and falls back to exact rupees under
// ₹1 Lakh so small numbers never collapse to "₹0 Lakh"/"₹1 Lakh".
export function formatInr(n: number | null | undefined): string | null {
  if (n == null) return null;
  const abs = Math.abs(n);
  if (abs >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (abs >= 1e5) {
    const l = n / 1e5;
    return `₹${Number.isInteger(l) ? l.toFixed(0) : l.toFixed(2)} Lakh`;
  }
  return formatInrExact(n);
}

// Truncates at the last whole word before maxLength and appends an ellipsis,
// instead of hard-cutting mid-word (e.g. "...beautifully designed high-str").
// No-op (returns the original string) if it already fits.
export function truncateAtWord(text: string, maxLength = 158): string {
  if (!text || text.length <= maxLength) return text;
  const cut = text.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(" ");
  const safe = lastSpace > 0 ? cut.slice(0, lastSpace) : cut;
  return `${safe.trimEnd()}…`;
}

export function slugify(text: string): string {
  return (text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

export type NormalizedProject = {
  slug: string;
  city_key: string;
  project_name: string;
  builder: string;
  property_category: string;
  property_type: string | null;
  project_status: string | null;
  rera_id: string | null;
  /** "active" | "lapsed" | "unverified" | "not_registered" — a correctly
   *  shaped rera_id is not the same as an active registration (see
   *  ReraBadge). Absent on older cached feed responses; treat as unknown. */
  rera_status: string | null;
  rera_valid_upto: string | null;
  rera_registered_with: string | null;
  rera_certificate_url: string | null;
  sector: string | null;
  micro_market: string | null;
  city_name: string;
  state: string;
  possession_text: string | null;
  price_text: string | null;
  min_price_inr: number | null;
  max_price_inr: number | null;
  min_size: number | null;
  max_size: number | null;
  size_unit: string | null;
  images: string[];
  interior_images: string[];
  about: string[];
  amenities: any[];
  specifications: any[];
  price_list: any[];
  builder_description: string[];
  recent_updates: any[];
  master_plan: { image?: string; content?: string } | null;
  /** Raw feed updatedAt, carried through so callers (the sitemap) can use a
   *  real per-record lastModified without re-fetching outside this shared
   *  normalization pipeline — see DEV-01, docs/seo/implementation-status.md. */
  updated_at: string | null;
};

// DEV-02 (2026-09-16): confirmed live — M3M Latitude, SS Camasa and DLF The
// Summit are all fetched from the ggnCommercialProjects segment (the
// upstream source's own category bucket) despite every one of them being an
// unambiguous residential apartment project ("3-4 BHK apartments", "512
// spacious homes", "residential towers"). BHKType ("Bedroom Hall Kitchen")
// is a configuration format that only ever describes a residential unit,
// so its presence is a narrow, reliable signal the upstream bucket is
// wrong — this only ever corrects Commercial -> Residential, never the
// other direction, since a project merely mentioning "commercial" in
// passing isn't remotely the same strength of evidence.
function hasResidentialConfiguration(bhkType: unknown): boolean {
  return typeof bhkType === "string" && /\bBHK\b/i.test(bhkType);
}

export function normalizeProject(raw: any, cityKey: string, category: string): NormalizedProject {
  const meta = CITY_META[cityKey] || { name: cityKey, state: "India" };
  const name = raw.projectTitle || "Untitled Project";
  const price = extractPriceRange(raw.price, raw.priceList);
  const size = extractSizeRange(raw.size);
  // 2026-09-21: widened from BHKType alone to the fuller residential-evidence
  // set in dataQuality.ts. The 21 Sep audit found residential projects still
  // presenting as Commercial, and BHKType is frequently absent on exactly the
  // records that need correcting -- a project whose own copy says "512
  // spacious homes" or "residential towers" is not ambiguous. Still one-way,
  // Commercial -> Residential only, for the reason in the note above.
  const effectiveCategory =
    category === "Commercial" &&
    (hasResidentialConfiguration(raw.BHKType) ||
      projectLooksResidential(raw.BHKType, name, raw.aboutProject))
      ? "Residential"
      : category;

  return {
    slug: slugify(name),
    city_key: cityKey,
    project_name: name,
    builder: extractBuilder(name),
    property_category: effectiveCategory,
    property_type: raw.BHKType || null,
    project_status: raw.projectStatus || null,
    rera_id: raw.reraId || null,
    rera_status: raw.reraStatus || null,
    rera_valid_upto: raw.reraValidUpto || null,
    rera_registered_with: raw.reraRegisteredWith || null,
    rera_certificate_url: raw.reraCertificateUrl || null,
    sector: extractSector(name, raw.aboutProject, raw.location),
    micro_market: extractMicroMarket(name, raw.aboutProject, raw.location),
    city_name: meta.name,
    state: meta.state,
    possession_text: raw.possession || null,
    price_text: raw.price || null,
    min_price_inr: price.min,
    max_price_inr: price.max,
    min_size: size.min,
    max_size: size.max,
    size_unit: size.unit,
    images: Array.isArray(raw.images) ? raw.images : [],
    interior_images: Array.isArray(raw.interiorImages) ? raw.interiorImages : [],
    about: stripSyndicatedText(
      redactEmbeddedRegulatoryIds(Array.isArray(raw.aboutProject) ? raw.aboutProject : [])
    ),
    // 2026-09-22, checklist item 2 ("all text fields... price section, FAQs,
    // investment sections, specifications"): these four arrive as structured
    // data rather than paragraphs, so stripSyndicatedText never saw them and
    // a syndicated sentence in a specification row or a price-list note
    // rendered untouched. stripCompetitorDeep walks the structure and drops
    // any entry whose text was entirely competitor content — see the rules on
    // it in dataQuality.ts.
    amenities: stripCompetitorDeep(Array.isArray(raw.amenities) ? raw.amenities : []),
    specifications: stripCompetitorDeep(
      Array.isArray(raw.specifications) ? raw.specifications : []
    ),
    price_list: stripCompetitorDeep(Array.isArray(raw.priceList) ? raw.priceList : []),
    builder_description: stripSyndicatedText(
      redactEmbeddedRegulatoryIds(
        Array.isArray(raw.builderDescription)
          ? raw.builderDescription
          : raw.builderDescription
          ? [String(raw.builderDescription)]
          : []
      )
    ),
    recent_updates: stripCompetitorDeep(
      Array.isArray(raw.recentUpdates) ? raw.recentUpdates : []
    ),
    master_plan:
      raw.masterPlan && (raw.masterPlan.image || raw.masterPlan.content)
        ? {
            image: raw.masterPlan.image,
            content: stripCompetitorProse(raw.masterPlan.content) ?? undefined,
          }
        : null,
    updated_at: raw.updatedAt || null,
  };
}
