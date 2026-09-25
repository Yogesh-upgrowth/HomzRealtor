// ─────────────────────────────────────────────────────────────────────────────
// Property detail view model — the individual-listing equivalent of
// view-model.ts's resolveProjectView, deliberately NOT reusing its live
// external-API pattern (Google Maps geocode/Places + OpenAI chat completion
// per project, cached 30 days). At property-listing volume — thousands,
// growing daily via the scrapers, vs. a few thousand projects — that would
// multiply real API cost and call volume by roughly the same factor.
//
// Instead this reads real data the backend (Homz-Scrape) already computed
// once, for free or via its own controlled LLM tier, and never live:
//   - landmarks: scraped, already in the feed (no Google Places call)
//   - investmentScore/riskScore/locationScore: real enrichment output (homz
//     enrich scores), not a client-side heuristic
//   - aiSummary: generated once per listing by the backend's own Anthropic
//     tier (homz enrich property-summaries), not a live OpenAI call here
//
// Same "never emit null/undefined/N/A to the UI" discipline as view-model.ts
// — reuses its clean()/validImages()/normalizeAmenities() directly.
// ─────────────────────────────────────────────────────────────────────────────

import { clean, normalizeAmenities, validImages } from "./view-model";
import type { Badge, Chip, HighlightStat, LinkItem, PersonaReasons } from "./view-model";
import { slugify } from "@/components/utils/slugify";
import {
  truncateAtWord,
  formatInr,
  formatInrExact,
  redactEmbeddedRegulatoryIds,
  looksLikeUnitSelectorDump,
  salvageAreaText,
} from "./normalize";
import type { PropertyCategory, RawHomzProperty } from "@/lib/scraping/homzbackend";

// Chrome-asset filtering (site logo, developer-logo thumbnail, amenity
// icons) now lives in view-model.ts's validImages() — Projects' image lists
// turned out to have the exact same problem, not just Properties'.
const propertyImages = validImages;

export type PropertyScoreView = {
  score: number;
  grade: string;
  verdict: string;
  riskScore: number | null;
  locationScore: number | null;
};

// Same shape as lib/intelligence/content.ts's FaqItem — deliberately, so the
// existing Faq component can render these without an adapter.
export type PropertyFaqItem = { q: string; a: string };

export type PropertyView = {
  id: string;
  title: string;
  slug: string;
  citySlug: string;
  category: PropertyCategory;
  /** Building/society name, when the feed actually names one — see
   *  extractProjectName(). null, not a guess, when it doesn't. */
  projectName: string | null;
  location: string;
  propertyType: string | null;
  listingType: string | null;
  status: string;
  possession: string | null;
  rera: string | null;
  /** "active" | "lapsed" | "unverified" | "not_registered" — see ReraBadge. */
  reraStatus: string | null;
  hasPrice: boolean;
  priceText: string;
  /** R19-06: the parsed numeric amount in INR behind priceText, carried
   *  through so structured data can emit a machine-readable price instead of
   *  the feed's display string ("70 L", "1.5 Cr", "60,000/month"). null when
   *  the feed gave no parsed value, in which case the Offer is omitted rather
   *  than guessed at. */
  priceValueInr: number | null;
  /** True when priceValueInr is a monthly rent rather than a sale price, so
   *  markup can state the billing period instead of implying a purchase. */
  priceIsMonthly: boolean;
  configuration: string | null;
  bedrooms: number | null;
  areaText: string | null;
  images: string[];
  heroImage: string | null;
  interiorImages: string[];
  masterPlan: { image?: string } | null;
  about: string[];
  builderDescription: string | null;
  amenities: { category: string; amenities: string[] }[];
  amenityCount: number;
  specifications: { heading: string; value: string }[];
  landmarks: Record<string, { name: string; distance: string }[]>;
  aiSummary: string | null;
  investmentScore: PropertyScoreView | null;
  snapshot: Chip[];
  whyThisListing: Badge[];
  keyHighlights: string[];
  highlightStats: HighlightStat[];
  personaReasons: PersonaReasons;
  faq: PropertyFaqItem[];
  similarSearches: LinkItem[];
  internalLinks: LinkItem[];
  listingUrl: string | null;
  updatedAt: string | null;
};

const ROUTE_BASE: Record<PropertyCategory, string> = {
  Sale: "buy-property",
  Rent: "rent-property",
  Pg: "pg-property",
  Commercial: "commercial",
};

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  apartment: "Apartment",
  builder_floor: "Builder Floor",
  independent_house: "Independent House",
  villa: "Villa",
  plot: "Plot",
  penthouse: "Penthouse",
  studio: "Studio",
  office: "Office",
  retail_shop: "Retail Shop",
  showroom: "Showroom",
  warehouse: "Warehouse",
  co_working: "Co-working Space",
  farmhouse: "Farmhouse",
  serviced_apartment: "Serviced Apartment",
  other: "Property",
};

/** Individual listings don't have unique titles the way projects do (many
 *  units share "3 BHK Flat for Sale in Sector 60") — the slug incorporates
 *  part of the backend's stable id to guarantee uniqueness. Must match
 *  PropertyListingPage.tsx's slugFor() exactly, or card links 404. */
export function slugForProperty(property: RawHomzProperty): string {
  const idTail = (property.id || "").split(":").pop()?.slice(-8) || "";
  return `${slugify(property.title || "property")}-${idTail}`;
}

// DEV-05 (2026-09-16): confirmed live — 18 of 83 sampled transaction
// details shared a title across 8 groups, because buildPropertyTitle only
// ever used bedroom count + type + location (e.g. "3 BHK Apartment, Sector
// 45 Gurgaon"), and many genuinely different listings in the same sector
// share that exact combination. The building/society name is the real
// differentiator and is often already present in the feed, just not
// structured consistently: a "Project" specification row exists for only
// ~2% of listings sampled, but ~25% of raw titles contain an extractable
// "... in {Project}, {Sector}" phrase. Checks the structured field first
// (more reliable when present), then the title text; returns null — never
// a guess — when neither is found, so callers can omit the fact cleanly
// per this codebase's own "never fabricate" discipline.
const PROJECT_IN_TITLE_RE = /\bin\s+([A-Z][A-Za-z0-9&.' -]{2,40}?),\s*(?:Sector|[A-Z])/;

// SEO audit 2026-09-25 (B1): the comma form above misses the most common raw
// shape, which ends the title on the project with no trailing locality —
// "3 BHK Apartment for Sale in Emaar Emerald Hills Phase 2" — so the project
// was dropped and 298 Sector 65 3-BHK pages shared one <title>. This second
// pattern only matches at end-of-title, and rejects bare localities (a
// sector, the city, a road or an expressway), which are not project names.
const PROJECT_AT_END_RE =
  /\bin\s+(?!Sector\b|Gurgaon\b|Gurugram\b|Sohna\b|New Gurgaon\b)([A-Z][A-Za-z0-9&.' -]{2,60}?)\s*$/;
const NOT_A_PROJECT_RE = /\b(?:road|extension|expressway|highway|marg|city|ncr)\s*$/i;

export function extractProjectName(property: RawHomzProperty): string | null {
  const specHit = (property.specifications || []).find(
    (s) => s?.heading?.trim().toLowerCase() === "project"
  );
  const fromSpec = clean(specHit?.value);
  if (fromSpec) return fromSpec;

  const title = property.title || "";
  const match = title.match(PROJECT_IN_TITLE_RE);
  if (match) return clean(match[1]);
  const atEnd = title.match(PROJECT_AT_END_RE);
  if (atEnd && !NOT_A_PROJECT_RE.test(atEnd[1])) return clean(atEnd[1]);
  return null;
}

// DEV-02 (2026-09-16): confirmed live — some scraped specification values
// (e.g. a "Super Built-up Area" row) carry an entire unit-selector
// dropdown's option list concatenated onto the real value, e.g. "1350 sqft
// sqft sqyrd sqm acre bigha hectare marla kanal biswa1 biswa2 ground
// aankadam rood chatak kottah marla cent perch guntha are katha gaj killa
// kuncham ₹ 56/sqft" instead of just "1350 sqft" (Ambience Creacions rental,
// id ending 38373139). specifications was rendered verbatim with no
// cleaning. Rather than guess which token is "correct" by trying to
// re-parse a contaminated string, this only ever keeps a value already
// confirmed clean (no known unit-selector tokens strung together); the
// clean area is shown separately anyway via areaText/the snapshot chip, so
// dropping a contaminated specs row loses no real information — matches
// the handoff's own "prefer honest omission to a fabricated correction."
//
// R19-04 (2026-09-19): the detector moved to normalize.ts so the same rule
// also guards property.size (the area chip, the cards and the meta
// description all read it) instead of only these specification rows.

function sanitizeSpecifications(
  specs: { heading: string; value: string }[]
): { heading: string; value: string }[] {
  return specs.filter((s) => !looksLikeUnitSelectorDump(String(s?.value ?? "")));
}

function landmarkCount(landmarks: Record<string, { name: string; distance: string }[]>): number {
  return Object.values(landmarks || {}).reduce((n, items) => n + (items?.length || 0), 0);
}

function nearestLandmark(
  landmarks: Record<string, { name: string; distance: string }[]>
): { category: string; name: string; distance: string } | null {
  let best: { category: string; name: string; distance: string } | null = null;
  let bestKm = Infinity;
  for (const [category, items] of Object.entries(landmarks || {})) {
    for (const item of items || []) {
      const match = clean(item.distance)?.match(/([\d.]+)\s*km/i);
      const km = match ? parseFloat(match[1]) : NaN;
      if (!Number.isNaN(km) && km < bestKm) {
        bestKm = km;
        best = { category, name: item.name, distance: item.distance };
      }
    }
  }
  return best;
}

function priceText(property: RawHomzProperty): { hasPrice: boolean; priceText: string } {
  const raw = clean(property.price);
  if (raw && raw !== "Price on Request") return { hasPrice: true, priceText: raw };
  return { hasPrice: false, priceText: "Price on Request" };
}

// R19-06 (2026-09-19): the feed's own parsed numerics, the same pair
// lib/listings/filters.ts already trusts for budget filtering. priceValue is
// a sale amount, rentMonthly a per-month amount — they are never both the
// meaningful one, so the listingType decides which is authoritative rather
// than a blind ?? chain that would call a rental's monthly figure a price.
function priceValue(property: RawHomzProperty): {
  priceValueInr: number | null;
  priceIsMonthly: boolean;
} {
  const isRental = property.listingType === "rent" || property.rentMonthly != null;
  const value = isRental
    ? property.rentMonthly ?? null
    : property.priceValue ?? null;
  // A non-positive amount is not a price; omit rather than publish a zero.
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return { priceValueInr: null, priceIsMonthly: isRental };
  }
  return { priceValueInr: value, priceIsMonthly: isRental };
}

// Real enrichment output (homz enrich scores), not a fabricated multi-factor
// breakdown like view-model.ts's buildInvestmentScore — there's exactly one
// real number per axis, so the "view" here is a grade/verdict wrapper around
// it, not a reconstruction of factors the backend didn't compute this way.
function buildScoreView(property: RawHomzProperty): PropertyScoreView | null {
  const score = property.investmentScore;
  if (score == null) return null;
  // 2026-09-22, checklist item 7. "Excellent / Strong" graded an investment,
  // and "worth a closer look" / "higher-risk opportunity" recommended one, on
  // the strength of a single backend number with no factor breakdown behind
  // it. Both now describe the number and say where it came from — see
  // LISTING_SCORE_NOTE on why this score is not the project five-factor one.
  const grade =
    score >= 80 ? "Top band" : score >= 65 ? "Upper band" : score >= 50 ? "Middle band" : "Lower band";
  const verdict =
    `${score}/100 from our listing enrichment pipeline, which scores each listing as one number ` +
    `rather than the five-factor breakdown used on project pages. It reads the listing's own ` +
    `attributes and location, not its asking price, so it says nothing about whether the price is fair.`;
  return {
    score,
    grade,
    verdict,
    riskScore: property.riskScore ?? null,
    locationScore: property.locationScore ?? null,
  };
}

function buildSnapshot(property: RawHomzProperty, status: string, amenityCount: number): Chip[] {
  const chips: Chip[] = [];
  const push = (label: string, value: string | null | undefined) => {
    const v = clean(value);
    if (v) chips.push({ label, value: v });
  };
  const { hasPrice, priceText: pt } = priceText(property);
  push(property.listingType === "rent" ? "Monthly Rent" : "Price", hasPrice ? pt : null);
  push("Configuration", property.configuration || (property.bedrooms ? `${property.bedrooms} BHK` : null));
  push("Property Type", PROPERTY_TYPE_LABELS[property.propertyType || ""] || null);
  push("Area", salvageAreaText(property.size));
  push("Status", status === "Status on request" ? null : status);
  // Right after Status/before Possession — same reasoning as
  // view-model.ts's buildChips: RERA status belongs next to "Ready to
  // Move", not buried after Location.
  const rera = clean(property.reraId);
  if (rera) {
    const suffix =
      property.reraStatus === "lapsed" ? " (Lapsed)" : property.reraStatus === "unverified" ? " (Unverified)" : "";
    chips.push({ label: "RERA", value: `${rera}${suffix}`, status: property.reraStatus || undefined });
  }
  push("Possession", property.possession);
  push("Location", property.location);
  if (amenityCount > 0) push("Amenities", `${amenityCount}+ amenities`);
  return chips.slice(0, 8);
}

function buildWhyThisListing(
  property: RawHomzProperty,
  status: string,
  score: PropertyScoreView | null,
  amenityCount: number,
  isGolfFacing: boolean
): Badge[] {
  const badges: Badge[] = [];
  const seen = new Set<string>();
  const add = (icon: string, label: string, note?: string) => {
    if (seen.has(label)) return;
    seen.add(label);
    badges.push({ icon, label, note });
  };

  // A real, correctly-shaped reraId is not the same as an active
  // registration (see components/Common/ReraBadge.tsx) — only claim
  // "Government-verified" when the backend has actually confirmed it active
  // against the official registry; a lapsed one gets its own honest badge
  // instead of silently claiming nothing or, worse, claiming it's fine.
  if (property.reraStatus === "active") add("BadgeCheck", "RERA Registered", "Government-verified listing");
  else if (property.reraStatus === "lapsed") add("AlertTriangle", "RERA Lapsed", "Registration on file has expired");
  if (status === "Ready to Move") add("KeyRound", "Ready to Move", "No construction wait");
  else if (status === "New Launch") add("Sparkles", "New Launch", "Early-bird pricing");
  else if (status === "Under Construction") add("HardHat", "Under Construction", "Capital-appreciation potential");
  if (isGolfFacing) add("MapPin", "Golf Course Facing", "Premium corridor location");
  if (score && score.score >= 65) add("TrendingUp", "Investment Grade", `Scores ${score.score}/100 on our fundamentals`);
  if (property.isCommercial) add("Briefcase", "Commercial Asset", "Rental-yield potential");
  if (amenityCount >= 10) add("Dumbbell", "Amenity-Rich", `${amenityCount}+ lifestyle amenities`);
  if (property.listingType === "resale") add("Home", "Resale Unit", "Move-in ready, established society");

  if (badges.length < 4) add("MapPin", "Well-Connected Location", property.location || "Gurgaon");
  if (badges.length < 4) add("ShieldCheck", "HomzRealtor Verified", "Assisted site visits");

  return badges.slice(0, 8);
}

function buildKeyHighlights(
  property: RawHomzProperty,
  status: string,
  amenityCount: number,
  nearest: { category: string; name: string; distance: string } | null
): string[] {
  const out: string[] = [];
  if (property.location) out.push(`Located in ${property.location}.`);
  const type = PROPERTY_TYPE_LABELS[property.propertyType || ""];
  if (type) out.push(`A ${type.toLowerCase()}${property.configuration ? ` (${property.configuration})` : ""}.`);
  const { hasPrice, priceText: pt } = priceText(property);
  if (hasPrice) out.push(`${property.listingType === "rent" ? "Rent" : "Price"}: ${pt}.`);
  if (status !== "Status on request") out.push(`${status}${property.possession ? `, ${property.possession}` : ""}.`);
  if (property.reraId) {
    if (property.reraStatus === "lapsed") out.push(`RERA registration (${property.reraId}) on file has lapsed: verify current status before booking.`);
    else if (property.reraStatus === "active") out.push(`RERA registered (${property.reraId}) for buyer protection.`);
    else out.push(`RERA number on file: ${property.reraId} (not independently verified).`);
  }
  if (nearest) out.push(`${nearest.name} (${nearest.category}) is ${nearest.distance} away.`);
  if (amenityCount > 0) out.push(`${amenityCount}+ amenities available.`);
  return Array.from(new Set(out)).slice(0, 8);
}

function buildHighlightStats(
  amenityCount: number,
  nearest: { category: string; name: string; distance: string } | null,
  score: PropertyScoreView | null
): HighlightStat[] {
  const stats: HighlightStat[] = [];
  if (nearest) {
    stats.push({ big: nearest.distance, title: `To Nearest ${nearest.category}`, subtitle: nearest.name });
  }
  if (amenityCount > 0 && stats.length < 3) {
    stats.push({ big: `${amenityCount}+`, title: "Amenities", subtitle: "Available at this listing." });
  }
  if (score && stats.length < 3) {
    stats.push({ big: `${score.score}`, title: "Homz Score", subtitle: `${score.grade} investment fundamentals.` });
  }
  return stats.slice(0, 3);
}

function buildPersonaReasons(
  property: RawHomzProperty,
  status: string,
  amenityCount: number,
  score: PropertyScoreView | null
): PersonaReasons {
  const isCommercial = Boolean(property.isCommercial);
  const loc = property.location || "this location";

  const investor: Badge[] = [];
  if (property.listingType === "rent") {
    investor.push({ icon: "TrendingUp", label: "Immediate Rental Income", note: "Move-in ready for a tenant." });
  } else if (isCommercial) {
    investor.push({ icon: "TrendingUp", label: "Leasing Potential", note: "Rental demand from retail/office tenants." });
  } else if (status === "Ready to Move") {
    investor.push({ icon: "KeyRound", label: "Immediate Possession", note: "No construction wait." });
  } else {
    investor.push({ icon: "TrendingUp", label: "Capital Appreciation", note: `Early-stage entry in ${loc}.` });
  }
  if (score) {
    investor.push({
      icon: "ShieldCheck",
      label: score.score >= 65 ? "Investment Grade" : "Higher-Risk Entry",
      note: `Scores ${score.score}/100 on our fundamentals.`,
    });
  }
  if (property.reraStatus === "active") {
    investor.push({ icon: "BadgeCheck", label: "RERA Registered", note: "Government-verified listing." });
  } else if (property.reraStatus === "lapsed") {
    investor.push({ icon: "AlertTriangle", label: "RERA Lapsed", note: "Registration on file has expired." });
  }

  const endUser: Badge[] = [{ icon: "MapPin", label: "Prime Location", note: loc }];
  if (amenityCount > 0) endUser.push({ icon: "Sparkles", label: "Lifestyle", note: `${amenityCount}+ amenities.` });
  endUser.push(
    isCommercial
      ? { icon: "Briefcase", label: "Business-Ready", note: "Suited for retail or office use." }
      : { icon: "Home", label: "Comfortable Living", note: "Ready for day-to-day life." }
  );

  return { investor: investor.slice(0, 4), endUser: endUser.slice(0, 4) };
}

function buildFaq(property: RawHomzProperty, status: string, category: PropertyCategory): PropertyFaqItem[] {
  const faqs: PropertyFaqItem[] = [];
  const { hasPrice, priceText: pt } = priceText(property);
  const priceLabel = category === "Rent" ? "the monthly rent" : "the price";
  faqs.push({
    q: `What is ${priceLabel} for this listing?`,
    a: hasPrice ? pt : "Price is available on request, contact us for the latest quote.",
  });
  if (property.possession) {
    faqs.push({ q: "When is possession available?", a: `${status}${property.possession ? `, ${property.possession}` : ""}.` });
  }
  if (property.reraId) {
    const answer =
      property.reraStatus === "lapsed"
        ? `A RERA registration (${property.reraId}) is on file, but it has lapsed; please verify current status with the developer before booking.`
        : property.reraStatus === "active"
          ? `Yes, RERA number ${property.reraId}.`
          : `RERA number ${property.reraId} is on file (not independently verified against the official registry).`;
    faqs.push({ q: "Is this listing RERA registered?", a: answer });
  }
  if (property.amenities && property.amenities.length > 0) {
    const names = property.amenities.flatMap((a) => a.amenities).slice(0, 5);
    if (names.length) faqs.push({ q: "What amenities are available?", a: `${names.join(", ")}, and more.` });
  }
  return faqs;
}

function buildLinks(category: PropertyCategory, citySlug: string): { similar: LinkItem[]; internal: LinkItem[] } {
  const base = `/${ROUTE_BASE[category]}`;
  return {
    similar: [
      { label: `More ${category} Listings in Gurgaon`, href: base },
      { label: "Buy Property in Gurgaon", href: "/buy-property" },
      { label: "Rent Property in Gurgaon", href: "/rent-property" },
      { label: "Commercial Properties in Gurgaon", href: "/commercial" },
    ],
    internal: [
      { label: "All Listings", href: base },
      { label: "Browse Projects", href: `/project-listing/${citySlug}` },
    ],
  };
}

/** Best-effort possession status label, same rules as view-model.ts's
 *  deriveStatusFromText — reimplemented locally since that one isn't
 *  exported, but the logic is identical so the two pages read consistently. */
function deriveStatus(projectStatus: string | null | undefined, possessionText: string | null | undefined): string {
  const feed = clean(projectStatus);
  if (feed) return feed;
  const p = (clean(possessionText) || "").toLowerCase();
  if (!p) return "Status on request";
  if (/ready|rtm|possession available|immediate|completed|delivered/.test(p)) return "Ready to Move";
  if (/new launch|newly launched|pre.?launch|launching/.test(p)) return "New Launch";
  return "Under Construction";
}

export function resolvePropertyView(
  property: RawHomzProperty,
  opts: { category: PropertyCategory; citySlug: string }
): PropertyView {
  const status = deriveStatus(property.projectStatus, property.possession);
  const amenities = normalizeAmenities(property.amenities || []);
  const amenityCount = amenities.reduce((n, c) => n + c.amenities.length, 0);
  const images = propertyImages(property.images || []);
  const landmarks = property.landmarks || {};
  const nearest = nearestLandmark(landmarks);
  const isGolfFacing = `${property.location || ""} ${(property.aboutProject || []).join(" ")}`
    .toLowerCase()
    .includes("golf");
  const score = buildScoreView(property);
  const { hasPrice, priceText: pt } = priceText(property);

  return {
    id: property.id || "",
    title: property.title || "Untitled Listing",
    slug: slugForProperty(property),
    citySlug: opts.citySlug,
    category: opts.category,
    projectName: extractProjectName(property),
    location: clean(property.location) || "Gurgaon",
    propertyType: PROPERTY_TYPE_LABELS[property.propertyType || ""] || null,
    listingType: property.listingType || null,
    status,
    possession: clean(property.possession),
    rera: clean(property.reraId),
    reraStatus: property.reraStatus || null,
    hasPrice,
    priceText: pt,
    ...priceValue(property),
    configuration: clean(property.configuration),
    bedrooms: property.bedrooms ?? null,
    areaText: clean(salvageAreaText(property.size)),
    images,
    heroImage: images[0] || null,
    interiorImages: propertyImages(property.interiorImages || []),
    masterPlan: property.masterPlan && Object.keys(property.masterPlan).length ? property.masterPlan : null,
    about: redactEmbeddedRegulatoryIds(property.aboutProject || [])
      .map((a) => clean(a))
      .filter(Boolean) as string[],
    builderDescription: clean(
      redactEmbeddedRegulatoryIds([property.builderDescription || ""])[0]
    ),
    amenities,
    amenityCount,
    specifications: sanitizeSpecifications(property.specifications || []),
    landmarks,
    aiSummary: clean(property.aiSummary),
    investmentScore: score,
    snapshot: buildSnapshot(property, status, amenityCount),
    whyThisListing: buildWhyThisListing(property, status, score, amenityCount, isGolfFacing),
    keyHighlights: buildKeyHighlights(property, status, amenityCount, nearest),
    highlightStats: buildHighlightStats(amenityCount, nearest, score),
    personaReasons: buildPersonaReasons(property, status, amenityCount, score),
    faq: buildFaq(property, status, opts.category),
    ...buildLinksWrapper(opts.category, opts.citySlug),
    listingUrl: clean(property.listingUrl),
    updatedAt: clean(property.updatedAt),
  };
}

function buildLinksWrapper(category: PropertyCategory, citySlug: string) {
  const { similar, internal } = buildLinks(category, citySlug);
  return { similarSearches: similar, internalLinks: internal };
}

/** Meta description for a property detail page — SEO audit (C-03,
 *  2026-09-08) found propertyDetailRoute.tsx was using keyHighlights[0] for
 *  this, which is always "Located in {location}." (buildKeyHighlights()
 *  pushes that unconditionally first) — 19-30 chars, no price, no BHK, no
 *  differentiator, identical shape across thousands of pages.
 *
 *  Built from the same real fields the page itself already renders (price,
 *  configuration, area, status/possession) — not a template referencing
 *  fields this codebase doesn't have (furnishing, dealType, tenant profile
 *  aren't on RawHomzProperty/PropertyView; a generic description built from
 *  real fields beats a richer-looking one built from fields that don't
 *  exist and would silently render "undefined"). */
export function buildPropertyDescription(view: PropertyView): string {
  const config = view.configuration || (view.bedrooms ? `${view.bedrooms} BHK` : null);
  const type = (view.propertyType || "Property").toLowerCase();
  const configType = config ? `${config} ${type}` : type;

  // priceText is the feed's own raw price string verbatim (see priceText()
  // above) — for Rent/Pg it already carries a "/month" suffix baked in
  // (confirmed live: "60,000/month"), so appending one here doubled it.
  const priceBit = view.hasPrice
    ? `${view.category === "Rent" || view.category === "Pg" ? "at" : "from"} ${view.priceText}`
    : "with pricing on request";

  const areaBit = view.areaText ? `, ${view.areaText}` : "";
  const statusBit = view.status !== "Status on request" ? `, ${view.status}` : "";

  const verb =
    view.category === "Rent" || view.category === "Pg"
      ? "for rent"
      : view.category === "Commercial"
        ? "for sale/lease"
        : "for sale";

  const cta =
    view.category === "Rent" || view.category === "Pg"
      ? "View photos, amenities and arrange a visit"
      : view.category === "Commercial"
        ? "Get specifications, amenities and site-visit support"
        : "Compare amenities, floor plans and payment options";

  // DEV-05 (2026-09-16): includes projectName (see extractProjectName())
  // when the feed names one — same differentiator fix as buildPropertyTitle,
  // for the same reason (many listings otherwise share identical
  // config+location, producing duplicate descriptions too).
  const locationBit = view.projectName ? `${view.projectName}, ${view.location}` : view.location;

  const sentence =
    `${configType} ${verb} in ${locationBit}${areaBit}, ${priceBit}${statusBit}. ` +
    `${cta} on HomzRealtor.`;

  return truncateAtWord(sentence);
}

/** <title> tag for a property detail page — SEO audit (H-02, 2026-09-08)
 *  found propertyDetailRoute.tsx used the feed's raw title verbatim, which
 *  fails in both directions: verbose auto-generated titles run 90+ chars
 *  (truncated mid-word in the SERP), while others are just a bare project
 *  name at 14-17 chars (no location, no intent, nothing for a search result
 *  to differentiate on). Built from the same structured fields as
 *  buildPropertyDescription().
 *
 *  DEV-05 (2026-09-16): confirmed live — 18 of 83 sampled details shared a
 *  title across 8 groups, because this used to omit the building/society
 *  name entirely (bedroom count + type + location only) — many genuinely
 *  different listings in the same sector share that combination. Now
 *  includes `view.projectName` when the feed actually names one (see
 *  extractProjectName()), matching the handoff's own suggested pattern
 *  ("{config} for {Sale|Rent} in {Project}, {Sector} | Homz"); omits it
 *  cleanly, falling back to the previous shape, when no project name is
 *  available rather than fabricating one.
 *
 *  Prefers the numeric bedroom count over the raw `configuration` string
 *  (which can carry extra qualifiers like "4 BHK + Servant") — "4 BHK" is
 *  what gets searched, the qualifier just eats budget that location needs
 *  more. Length is a soft cap here, not the old fixed 52-58 char build gate
 *  (the handoff explicitly rejects "blind name truncation" against a rigid
 *  threshold) — truncates the entity/location at a word boundary only when
 *  it runs unusually long, never the trailing brand suffix. */
export function buildPropertyTitle(view: PropertyView): string {
  // SEO audit 2026-09-25 (B1): config + area + project + sector + price. The
  // previous "{config} {type} for Sale in {Project}, {Sector}" shape still
  // collided whenever the project was missing, and even with it, a project
  // with 16 3-BHK units produced 16 identical titles. Area and asking price
  // are the two fields that actually differ between units, and price is
  // what a searcher scans the SERP for. The brand suffix now comes from the
  // root layout's title template, so it is not appended here.
  const type = view.propertyType && view.propertyType !== "Property" ? view.propertyType : null;
  const config = view.bedrooms
    ? `${view.bedrooms} BHK`
    : view.configuration || type || "Property";

  const verb =
    view.category === "Rent" || view.category === "Pg"
      ? "for Rent"
      : view.category === "Commercial"
        ? view.listingType === "rent" || view.listingType === "lease"
          ? "for Lease"
          : "for Sale"
        : "for Sale";

  const area = titleArea(view.areaText);
  const price = titlePrice(view);
  // "Sector 65, Gurgaon" → "Sector 65": the sector is the searched term, the
  // city is the first thing to give up when space is short.
  const shortLocation = view.location.replace(/,\s*(Gurgaon|Gurugram)$/i, "");

  const build = (withType: boolean, location: string, project: string | null) => {
    const head = `${config}${withType && type && type !== config ? ` ${type}` : ""}${area ? `, ${area}` : ""}`;
    const where = project ? `${project}, ${location}` : location;
    return `${head} ${verb} in ${where}${price ? ` — ${price}` : ""}`;
  };

  // Most to least descriptive; the first that fits wins. The type word goes
  // first ("3 BHK" already implies a home), then the city, then the project
  // name is shortened -- never the sector or the price, which are what make
  // the title unique and query-shaped.
  const MAX = 78;
  const candidates = [
    build(true, view.location, view.projectName),
    build(false, view.location, view.projectName),
    build(false, shortLocation, view.projectName),
  ];
  for (const c of candidates) if (c.length <= MAX) return c;
  if (!view.projectName) return truncateAtWord(candidates[2], MAX);
  const overflow = candidates[2].length - MAX;
  const project = truncateAtWord(view.projectName, Math.max(12, view.projectName.length - overflow - 1)).replace(/…$/, "");
  return build(false, shortLocation, project);
}

/** "1350 Sq.Ft." / "1350 sqft" → "1350 sq ft"; other units pass through. */
function titleArea(areaText: string | null): string | null {
  if (!areaText) return null;
  return areaText
    .replace(/\s*sq\.?\s*-?\s*f(?:ee)?t\.?/i, " sq ft")
    .replace(/\s*sq\.?\s*-?\s*y(?:ar)?ds?\.?/i, " sq yd")
    .replace(/\s+/g, " ")
    .trim();
}

/** Short SERP price, from the parsed numeric amount only — never the feed's
 *  raw display string, which has shipped as a bare integer ("24000000"). */
function titlePrice(view: PropertyView): string | null {
  const n = view.priceValueInr;
  if (n == null) return null;
  if (view.priceIsMonthly) {
    const monthly = formatInrExact(n);
    return monthly ? `${monthly}/mo` : null;
  }
  const short = formatInr(n);
  // "₹2.40 Cr" → "₹2.4 Cr", "₹85.50 Lakh" → "₹85.5 Lakh"
  return short ? short.replace(/(\.\d*?)0+(\s)/, "$1$2").replace(/\.(\s)/, "$1") : null;
}

export { landmarkCount };
