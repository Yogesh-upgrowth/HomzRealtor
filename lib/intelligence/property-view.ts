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

// Real enrichment output (homz enrich scores), not a fabricated multi-factor
// breakdown like view-model.ts's buildInvestmentScore — there's exactly one
// real number per axis, so the "view" here is a grade/verdict wrapper around
// it, not a reconstruction of factors the backend didn't compute this way.
function buildScoreView(property: RawHomzProperty): PropertyScoreView | null {
  const score = property.investmentScore;
  if (score == null) return null;
  const grade = score >= 80 ? "Excellent" : score >= 65 ? "Strong" : score >= 50 ? "Good" : "Fair";
  const verdict =
    score >= 65
      ? "Scores well on the fundamentals we track for this listing — worth a closer look."
      : "An early-stage or higher-risk opportunity by our scoring — worth weighing against your specific goals.";
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
  push("Area", property.size);
  push("Status", status === "Status on request" ? null : status);
  push("Possession", property.possession);
  push("Location", property.location);
  const rera = clean(property.reraId);
  if (rera) {
    const suffix =
      property.reraStatus === "lapsed" ? " (Lapsed)" : property.reraStatus === "unverified" ? " (Unverified)" : "";
    chips.push({ label: "RERA", value: `${rera}${suffix}` });
  }
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
  if (status !== "Status on request") out.push(`${status}${property.possession ? ` — ${property.possession}` : ""}.`);
  if (property.reraId) {
    if (property.reraStatus === "lapsed") out.push(`RERA registration (${property.reraId}) on file has lapsed — verify current status before booking.`);
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
    a: hasPrice ? pt : "Price is available on request — contact us for the latest quote.",
  });
  if (property.possession) {
    faqs.push({ q: "When is possession available?", a: `${status}${property.possession ? ` — ${property.possession}` : ""}.` });
  }
  if (property.reraId) {
    const answer =
      property.reraStatus === "lapsed"
        ? `A RERA registration (${property.reraId}) is on file, but it has lapsed — please verify current status with the developer before booking.`
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
    location: clean(property.location) || "Gurgaon",
    propertyType: PROPERTY_TYPE_LABELS[property.propertyType || ""] || null,
    listingType: property.listingType || null,
    status,
    possession: clean(property.possession),
    rera: clean(property.reraId),
    reraStatus: property.reraStatus || null,
    hasPrice,
    priceText: pt,
    configuration: clean(property.configuration),
    bedrooms: property.bedrooms ?? null,
    areaText: clean(property.size),
    images,
    heroImage: images[0] || null,
    interiorImages: propertyImages(property.interiorImages || []),
    masterPlan: property.masterPlan && Object.keys(property.masterPlan).length ? property.masterPlan : null,
    about: (property.aboutProject || []).map((a) => clean(a)).filter(Boolean) as string[],
    builderDescription: clean(property.builderDescription),
    amenities,
    amenityCount,
    specifications: property.specifications || [],
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

export { landmarkCount };
