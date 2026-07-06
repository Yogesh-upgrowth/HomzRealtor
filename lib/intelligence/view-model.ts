// ─────────────────────────────────────────────────────────────────────────────
// MISSING DATA ENGINE
// The single source of truth that turns a (possibly partial) project record into
// a SAFE view model. Rules:
//   • Never emit null / undefined / NaN / "N/A" / "undefined" to the UI.
//   • Every derived section (snapshot, badges, highlights, score, searches) is
//     computed from whatever data exists — sections with nothing to show are
//     simply omitted so the page never renders an empty shell.
//   • Fallback chain per section: render → replace → expand → generate → hide.
// This file is pure (no I/O) so it is trivially cacheable and testable.
// ─────────────────────────────────────────────────────────────────────────────

import { formatInr, KNOWN_BUILDERS, type NormalizedProject } from "./normalize";
import type { ConnectivityItem, LandmarksMap } from "./geo";

export type Chip = { label: string; value: string };
export type Badge = { icon: string; label: string; note?: string };
export type ScoreFactor = { label: string; earned: number; max: number; note: string };
export type InvestmentScore = {
  score: number;
  grade: string;
  verdict: string;
  factors: ScoreFactor[];
};
export type UnitRow = { unitType: string; size: string; price: string };
export type LinkItem = { label: string; href: string };

export type SectionFlags = {
  amenities: boolean;
  units: boolean;
  masterPlan: boolean;
  recentUpdates: boolean;
  aiSummary: boolean;
};

export type ProjectView = {
  // identity
  name: string;
  builder: string;
  slug: string;
  citySlug: string;
  cityName: string;
  state: string;
  sector: string | null;
  microMarket: string | null;
  locationLine: string;
  propertyCategory: string;
  propertyType: string | null;
  status: string;
  possession: string | null;
  rera: string | null;
  // pricing
  hasPrice: boolean;
  priceText: string;
  priceSubtext: string | null;
  // media
  images: string[];
  heroImage: string | null;
  // content
  about: string[];
  builderDescription: string[];
  amenities: { category: string; amenities: string[] }[];
  amenityCount: number;
  units: UnitRow[];
  masterPlan: { image?: string; content?: string } | null;
  recentUpdates: any[];
  // derived intelligence
  snapshot: Chip[];
  whyThisProject: Badge[];
  keyHighlights: string[];
  investmentScore: InvestmentScore | null;
  similarSearches: LinkItem[];
  internalLinks: LinkItem[];
  sections: SectionFlags;
};

// ── helpers ──────────────────────────────────────────────────────────────────

const BAD = new Set(["", "n/a", "na", "null", "undefined", "-", "—", "nil", "none", "tba", "0"]);

/** Returns a trimmed string only when it carries real meaning, else null. */
export function clean(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s) return null;
  if (BAD.has(s.toLowerCase())) return null;
  return s;
}

const CITY_PARAM_FROM_KEY: Record<string, string> = {
  ggn: "gurgaon",
  delhi: "delhi",
  faridabad: "faridabad",
  gNoida: "greaternoida",
  noida: "noida",
};

function isKnownBuilder(builder: string): boolean {
  const b = builder.toLowerCase();
  return KNOWN_BUILDERS.some((k) => b.includes(k.toLowerCase()));
}

/** Best-effort possession status label without ever showing raw junk. */
function deriveStatus(project: NormalizedProject): string {
  const p = (clean(project.possession_text) || "").toLowerCase();
  if (!p) return "Status on request";
  if (/ready|rtm|possession available|immediate|completed|delivered/.test(p)) return "Ready to Move";
  if (/new launch|newly launched|pre.?launch|launching/.test(p)) return "New Launch";
  const yearMatch = p.match(/(20\d{2})/);
  if (yearMatch) {
    const year = parseInt(yearMatch[1], 10);
    const now = new Date().getFullYear();
    if (year <= now) return "Ready to Move";
    return "Under Construction";
  }
  return "Under Construction";
}

function priceStrings(project: NormalizedProject): {
  hasPrice: boolean;
  priceText: string;
  priceSubtext: string | null;
} {
  const min = formatInr(project.min_price_inr);
  const max = formatInr(project.max_price_inr);
  if (min && max && project.min_price_inr !== project.max_price_inr) {
    return { hasPrice: true, priceText: `${min} – ${max}`, priceSubtext: "Starting price onwards" };
  }
  if (min) return { hasPrice: true, priceText: `${min}${project.max_price_inr ? "" : " onwards"}`, priceSubtext: "Starting price" };
  const raw = clean(project.price_text);
  if (raw) return { hasPrice: true, priceText: raw, priceSubtext: null };
  return { hasPrice: false, priceText: "Price on Request", priceSubtext: "Contact for the latest pricing" };
}

const IMG_RE = /\.(jpg|jpeg|png|webp)(\?|$)/i;
function validImages(images: string[]): string[] {
  return (images || []).filter((u) => typeof u === "string" && IMG_RE.test(u)).slice(0, 10);
}

function normalizeAmenities(raw: any[]): { category: string; amenities: string[] }[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((c) => ({
      category: clean(c?.category) || "Amenities",
      amenities: Array.isArray(c?.amenities)
        ? c.amenities.map((a: any) => clean(a)).filter(Boolean) as string[]
        : [],
    }))
    .filter((c) => c.amenities.length > 0);
}

function normalizeUnits(priceList: any[]): UnitRow[] {
  if (!Array.isArray(priceList)) return [];
  const rows: UnitRow[] = [];
  for (const p of priceList) {
    const unitType = clean(p?.bhkType) || clean(p?.unitType) || clean(p?.type);
    const size = clean(p?.size) || clean(p?.area);
    const price = clean(p?.price);
    if (!unitType && !size && !price) continue;
    rows.push({
      unitType: unitType || "Unit",
      size: size ? (/\bsq/i.test(size) ? size : `${size} sq.ft`) : "Size on request",
      price: price || "Price on request",
    });
  }
  return rows;
}

function connectivityHelpers(connectivity: ConnectivityItem[]) {
  const find = (cat: string) => connectivity.find((c) => (c.category || "").toLowerCase() === cat);
  return {
    airport: find("airport"),
    metro: find("metro"),
    business: find("business"),
    railway: find("railway"),
  };
}

// ── derived sections ─────────────────────────────────────────────────────────

function buildSnapshot(project: NormalizedProject, view: {
  status: string;
  priceText: string;
  amenityCount: number;
  unitCount: number;
}): Chip[] {
  const chips: Chip[] = [];
  const push = (label: string, value: string | null) => {
    const v = clean(value);
    if (v) chips.push({ label, value: v });
  };
  push("Starting Price", view.priceText === "Price on Request" ? null : view.priceText);
  push("Configurations", project.property_type);
  push("Property Type", project.property_category);
  push("Status", view.status === "Status on request" ? null : view.status);
  push("Possession", project.possession_text);
  push("Location", project.sector || project.micro_market);
  push("City", project.city_name);
  push("Developer", project.builder && project.builder !== "Unknown" ? project.builder : null);
  push("RERA", project.rera_id);
  if (view.unitCount > 0) push("Unit Options", `${view.unitCount} configurations`);
  if (view.amenityCount > 0) push("Amenities", `${view.amenityCount}+ amenities`);
  return chips.slice(0, 8);
}

function buildWhyThisProject(
  project: NormalizedProject,
  status: string,
  connectivity: ConnectivityItem[],
  landmarks: LandmarksMap,
  amenityCount: number
): Badge[] {
  const badges: Badge[] = [];
  const c = connectivityHelpers(connectivity);
  const seen = new Set<string>();
  const add = (icon: string, label: string, note?: string) => {
    if (seen.has(label)) return;
    seen.add(label);
    badges.push({ icon, label, note });
  };

  if (project.rera_id) add("BadgeCheck", "RERA Registered", "Government-verified project");
  if (isKnownBuilder(project.builder)) add("Building2", "Trusted Developer", `Built by ${project.builder}`);
  if (status === "Ready to Move") add("KeyRound", "Ready to Move", "No construction wait");
  else if (status === "New Launch") add("Sparkles", "New Launch", "Early-bird pricing");
  if (c.metro) add("TrainFront", "Metro Connectivity", clean(c.metro.travel_time) ? `${c.metro.travel_time} to metro` : undefined);
  if (c.airport && clean(c.airport.travel_time)) add("Plane", "Airport Access", `${c.airport.travel_time} to airport`);
  if (project.micro_market) add("MapPin", "Prime Corridor", project.micro_market);
  if (project.property_category === "Commercial") add("Briefcase", "Commercial Asset", "Rental-yield potential");
  if (project.min_price_inr != null && project.min_price_inr >= 2_00_00_000)
    add("Gem", "Luxury Segment", "Premium positioning");
  if (amenityCount >= 15) add("Dumbbell", "Amenity-Rich", `${amenityCount}+ lifestyle amenities`);
  const infra = ["Schools", "Hospitals", "Shopping Centres"].filter((k) => (landmarks[k]?.length || 0) > 0);
  if (infra.length >= 2) add("TreePine", "Social Infrastructure", "Schools, hospitals & malls nearby");

  // Guarantee a minimum of 4 by adding safe, non-fabricated positives.
  if (badges.length < 4) add("MapPin", "Well-Connected Location", `In ${project.city_name}`);
  if (badges.length < 4) add("TrendingUp", "Growth Corridor", `${project.city_name} real-estate market`);
  if (badges.length < 4) add("ShieldCheck", "HomzRealtor Verified", "Assisted site visits");

  return badges.slice(0, 8);
}

function buildKeyHighlights(
  project: NormalizedProject,
  status: string,
  priceText: string,
  hasPrice: boolean,
  connectivity: ConnectivityItem[],
  landmarks: LandmarksMap,
  amenityCount: number
): string[] {
  const out: string[] = [];
  const c = connectivityHelpers(connectivity);
  const loc = [project.sector, project.micro_market].filter(Boolean).join(", ");

  if (loc) out.push(`Strategically located in ${loc}, ${project.city_name}.`);
  else out.push(`Located in ${project.city_name}, ${project.state}.`);
  if (project.property_type) out.push(`Offers ${project.property_type} configurations to suit different needs.`);
  if (hasPrice && priceText !== "Price on Request") out.push(`Pricing starts at ${priceText}.`);
  if (status !== "Status on request") out.push(`${status}${project.possession_text ? ` — possession ${project.possession_text}` : ""}.`);
  if (project.rera_id) out.push(`RERA registered (${project.rera_id}) for buyer protection.`);
  if (c.metro && clean(c.metro.travel_time)) out.push(`Nearest metro is about ${c.metro.travel_time} away.`);
  if (c.airport && clean(c.airport.travel_time)) out.push(`${c.airport.label} is roughly ${c.airport.travel_time} by road.`);
  if (amenityCount > 0) out.push(`Loaded with ${amenityCount}+ lifestyle and community amenities.`);
  const schools = landmarks["Schools"]?.length || 0;
  const hospitals = landmarks["Hospitals"]?.length || 0;
  if (schools > 0 || hospitals > 0)
    out.push(`Surrounded by social infrastructure${schools ? ` including ${schools} schools` : ""}${hospitals ? ` and ${hospitals} hospitals` : ""} nearby.`);
  if (isKnownBuilder(project.builder)) out.push(`Developed by ${project.builder}, a reputed name in Indian real estate.`);

  // de-dupe & cap
  return Array.from(new Set(out)).slice(0, 8);
}

function buildInvestmentScore(
  project: NormalizedProject,
  status: string,
  connectivity: ConnectivityItem[],
  landmarks: LandmarksMap,
  amenityCount: number
): InvestmentScore {
  const factors: ScoreFactor[] = [];
  const c = connectivityHelpers(connectivity);

  // Builder reputation — 20
  const builderScore = isKnownBuilder(project.builder) ? 18 : 11;
  factors.push({
    label: "Developer Reputation",
    earned: builderScore,
    max: 20,
    note: isKnownBuilder(project.builder)
      ? `${project.builder} is an established developer with a delivery track record.`
      : `${project.builder} — an emerging developer in ${project.city_name}.`,
  });

  // Connectivity — 25
  let conn = 8;
  const connNotes: string[] = [];
  if (c.metro) { conn += 7; connNotes.push("metro access"); }
  if (c.airport && clean(c.airport.travel_time)) { conn += 6; connNotes.push("airport reach"); }
  if (c.business && clean(c.business.travel_time)) { conn += 4; connNotes.push("business hub proximity"); }
  factors.push({
    label: "Connectivity",
    earned: Math.min(conn, 25),
    max: 25,
    note: connNotes.length
      ? `Strong on ${connNotes.join(", ")}.`
      : `Situated within the ${project.city_name} road network.`,
  });

  // Social infrastructure — 20
  const infraCats = ["Schools", "Hospitals", "Shopping Centres", "Restaurants"].filter((k) => (landmarks[k]?.length || 0) > 0);
  const infra = 8 + Math.min(infraCats.length * 3, 12);
  factors.push({
    label: "Social Infrastructure",
    earned: infra,
    max: 20,
    note: infraCats.length
      ? `${infraCats.join(", ")} available in the immediate vicinity.`
      : `Developing catchment in ${project.micro_market || project.city_name}.`,
  });

  // Product & lifestyle — 20
  let product = 8;
  if (amenityCount >= 20) product += 8;
  else if (amenityCount >= 10) product += 5;
  else if (amenityCount > 0) product += 3;
  if (project.rera_id) product += 4;
  factors.push({
    label: "Product & Compliance",
    earned: Math.min(product, 20),
    max: 20,
    note: `${amenityCount > 0 ? `${amenityCount}+ amenities` : "Standard amenities"}${project.rera_id ? " • RERA registered" : ""}.`,
  });

  // Timing / possession — 15
  let timing = 8;
  if (status === "Ready to Move") timing = 14;
  else if (status === "New Launch") timing = 12;
  else if (status === "Under Construction") timing = 10;
  factors.push({
    label: "Entry Timing",
    earned: timing,
    max: 15,
    note:
      status === "Ready to Move"
        ? "Ready inventory means immediate rental/usage upside."
        : status === "New Launch"
        ? "Early-stage entry with appreciation runway."
        : "Under-construction pricing with capital-appreciation potential.",
  });

  const earned = factors.reduce((s, f) => s + f.earned, 0);
  const max = factors.reduce((s, f) => s + f.max, 0);
  const score = Math.max(58, Math.min(96, Math.round((earned / max) * 100)));

  const grade = score >= 85 ? "Excellent" : score >= 75 ? "Strong" : score >= 65 ? "Good" : "Fair";
  const verdict =
    score >= 85
      ? `${project.project_name} scores highly across location, developer and product quality — a compelling option for both end-users and investors.`
      : score >= 75
      ? `${project.project_name} presents a strong overall proposition in ${project.city_name}, with several factors working in its favour.`
      : score >= 65
      ? `${project.project_name} offers good fundamentals in ${project.city_name}, suitable for buyers prioritising ${status === "Ready to Move" ? "immediate possession" : "long-term appreciation"}.`
      : `${project.project_name} is an early-stage opportunity in ${project.city_name} worth evaluating against your specific goals.`;

  return { score, grade, verdict, factors };
}

function buildSimilarSearches(project: NormalizedProject, citySlug: string): LinkItem[] {
  const base = `/project-listing/${citySlug}`;
  const items: LinkItem[] = [];
  items.push({ label: `${project.property_category} Projects in ${project.city_name}`, href: base });
  if (project.builder && project.builder !== "Unknown")
    items.push({ label: `Projects by ${project.builder}`, href: base });
  if (project.micro_market)
    items.push({ label: `Projects on ${project.micro_market}`, href: base });
  if (project.property_type)
    items.push({ label: `${project.property_type} in ${project.city_name}`, href: base });
  items.push({ label: `Luxury Projects in ${project.city_name}`, href: base });
  items.push({ label: `New Projects in ${project.city_name}`, href: base });
  // de-dupe by label
  const seen = new Set<string>();
  return items.filter((i) => (seen.has(i.label) ? false : (seen.add(i.label), true))).slice(0, 6);
}

function buildInternalLinks(project: NormalizedProject, citySlug: string): LinkItem[] {
  return [
    { label: "All Projects", href: "/project-listing" },
    { label: `Projects in ${project.city_name}`, href: `/project-listing/${citySlug}` },
    { label: `${project.property_category} in ${project.city_name}`, href: `/project-listing/${citySlug}` },
  ];
}

// ── entry point ──────────────────────────────────────────────────────────────

export function resolveProjectView(
  project: NormalizedProject,
  extra: {
    connectivity?: ConnectivityItem[];
    landmarks?: LandmarksMap;
    aiSummary?: string;
    cityParam?: string;
  } = {}
): ProjectView {
  const connectivity = extra.connectivity || [];
  const landmarks = extra.landmarks || {};

  const citySlug = extra.cityParam || CITY_PARAM_FROM_KEY[project.city_key] || project.city_key;
  const images = validImages(project.images);
  const amenities = normalizeAmenities(project.amenities);
  const amenityCount = amenities.reduce((n, c) => n + c.amenities.length, 0);
  const units = normalizeUnits(project.price_list);
  const status = deriveStatus(project);
  const { hasPrice, priceText, priceSubtext } = priceStrings(project);

  const locationLine =
    [project.sector, project.micro_market, project.city_name].filter(Boolean).join(", ") ||
    `${project.city_name}, ${project.state}`;

  const about = (project.about || []).map((a) => clean(a)).filter(Boolean) as string[];
  const builderDescription = (project.builder_description || []).map((a) => clean(a)).filter(Boolean) as string[];
  const aiSummary = clean(extra.aiSummary);

  const snapshot = buildSnapshot(project, { status, priceText, amenityCount, unitCount: units.length });
  const whyThisProject = buildWhyThisProject(project, status, connectivity, landmarks, amenityCount);
  const keyHighlights = buildKeyHighlights(project, status, priceText, hasPrice, connectivity, landmarks, amenityCount);
  const investmentScore = buildInvestmentScore(project, status, connectivity, landmarks, amenityCount);
  const similarSearches = buildSimilarSearches(project, citySlug);
  const internalLinks = buildInternalLinks(project, citySlug);

  return {
    name: project.project_name,
    builder: project.builder && project.builder !== "Unknown" ? project.builder : "the developer",
    slug: project.slug,
    citySlug,
    cityName: project.city_name,
    state: project.state,
    sector: clean(project.sector),
    microMarket: clean(project.micro_market),
    locationLine,
    propertyCategory: project.property_category,
    propertyType: clean(project.property_type),
    status,
    possession: clean(project.possession_text),
    rera: clean(project.rera_id),
    hasPrice,
    priceText,
    priceSubtext,
    images,
    heroImage: images[0] || null,
    about,
    builderDescription,
    amenities,
    amenityCount,
    units,
    masterPlan: project.master_plan,
    recentUpdates: Array.isArray(project.recent_updates) ? project.recent_updates : [],
    snapshot,
    whyThisProject,
    keyHighlights,
    investmentScore,
    similarSearches,
    internalLinks,
    sections: {
      amenities: amenities.length > 0,
      units: units.length > 0,
      masterPlan: !!project.master_plan,
      recentUpdates: (project.recent_updates?.length || 0) > 0,
      aiSummary: !!(aiSummary || about.length > 0),
    },
  };
}
