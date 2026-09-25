// The developer page's data (developer-page brief 2026-09-25).
//
// Everything /developer/[slug] shows beyond the raw project list is built
// here, from records we already hold: the intent ordering, the "Selling now"
// cards, a residential/commercial price split, resale and rental counts inside
// the developer's own projects, the launch tracker and the About text. Same
// rules as developerProfile.ts: nothing invented, every figure from a record,
// every section able to come back empty so a developer with thin data gets a
// short honest page rather than a padded one.

import { slugify, formatInr, formatInrExact, extractPriceRange, extractSizeRange } from "./normalize";
import type { NormalizedProject } from "./normalize";
import { intentStatus, type IntentStatus } from "./projectStatus";
import { resolveProjectView } from "./view-model";
import { resolveCoordinate } from "./resolveLocation";
import { nearbyConnectivity, nearbyLandmarks } from "./osmPlaces";
import { extractProjectName } from "./property-view";
import { buildDeveloperProfile, type DeveloperPriceStats } from "./developerProfile";
import { projectCorridorSlug, type DeveloperView } from "./developerViews";
import type { DeveloperProfile } from "./developerProfile";
import { GURGAON_CORRIDORS, listingSectorToken, sectorLabelFromToken } from "@/lib/listings/listingLocation";
import { MIN_HUB_LISTINGS } from "@/lib/listings/facets";
import { getSortedSegment } from "@/lib/listings/segmentCache";
import { propertySegment, type RawHomzProperty } from "@/lib/scraping/homzbackend";
import type { DeveloperProfileFacts } from "@/lib/content/developerProfiles";
import projectMedia from "@/data/media/project-media.json";

// ─────────────────────────────────────────────────────────── ordering

export { intentStatus, type IntentStatus } from "./projectStatus";

const RANK: Record<IntentStatus, number> = {
  "new-launch": 0,
  upcoming: 1,
  "under-construction": 2,
  "ready-to-move": 3,
  unknown: 4,
};

export const INTENT_STATUS_LABEL: Record<IntentStatus, string> = {
  "new-launch": "New launch",
  upcoming: "Upcoming",
  "under-construction": "Under construction",
  "ready-to-move": "Ready to move",
  unknown: "Status not stated",
};

function time(iso: string | null | undefined): number {
  const t = iso ? Date.parse(iso) : NaN;
  return Number.isNaN(t) ? 0 : t;
}

/** Status rank, then most recently updated, then highest entry price. */
export function sortByIntent(projects: NormalizedProject[]): NormalizedProject[] {
  return [...projects].sort(
    (a, b) =>
      RANK[intentStatus(a)] - RANK[intentStatus(b)] ||
      time(b.updated_at) - time(a.updated_at) ||
      (b.min_price_inr ?? 0) - (a.min_price_inr ?? 0) ||
      a.project_name.localeCompare(b.project_name)
  );
}

// ─────────────────────────────────────────────────────────── cards

export type CardConfig = { label: string; priceText: string | null; perSqFt: string | null };

export type SellingNowCard = {
  project: NormalizedProject;
  href: string;
  location: string;
  statusLabel: string;
  possession: string | null;
  configs: CardConfig[];
  units: string | null;
  landArea: string | null;
  chips: string[];
  score: number | null;
  /** Own image (Vercel Blob), else null. */
  image: string | null;
  /** Coordinate for the generated map tile, when it is at least sector-precise. */
  pin: { lat: number; lng: number } | null;
};

const ownedProjectMedia = projectMedia as Record<string, string[]>;

/** Homz-owned image for a project (data/media/project-media.json, keyed
 *  "{cityKey}:{slug}"), or null. Never a feed image: the brief rules out
 *  competitor CDN hotlinks on the developer template. */
export function ownedProjectImage(cityKey: string, slug: string): string | null {
  return ownedProjectMedia[`${cityKey}:${slug}`]?.[0] ?? null;
}

function corridorLabel(p: NormalizedProject): string | null {
  const slug = projectCorridorSlug(p);
  return slug ? GURGAON_CORRIDORS.find((c) => c.slug === slug)?.label ?? null : null;
}

function specValue(p: NormalizedProject, re: RegExp): string | null {
  const row = (p.specifications || []).find((s: { heading?: string; value?: string }) =>
    re.test(String(s?.heading ?? ""))
  );
  const v = String(row?.value ?? "").trim();
  return v && v.length <= 40 ? v : null;
}

function configsOf(p: NormalizedProject): CardConfig[] {
  const byLabel = new Map<string, { min: number | null; rate: number | null }>();
  for (const row of p.price_list || []) {
    const label = String(row?.bhkType || row?.unitType || row?.type || "").trim();
    if (!label) continue;
    const price = extractPriceRange(String(row?.price ?? ""), null).min;
    const size = extractSizeRange(String(row?.size ?? row?.area ?? ""));
    const rate =
      price && size.min && size.unit === "sq.ft" ? Math.round(price / size.min) : null;
    const prev = byLabel.get(label);
    if (!prev) byLabel.set(label, { min: price, rate });
    else {
      if (price && (!prev.min || price < prev.min)) prev.min = price;
      if (rate && (!prev.rate || rate < prev.rate)) prev.rate = rate;
    }
  }
  if (byLabel.size === 0 && p.property_type) {
    byLabel.set(p.property_type, { min: p.min_price_inr, rate: null });
  }
  return Array.from(byLabel.entries())
    .slice(0, 4)
    .map(([label, v]) => ({
      label,
      priceText: v.min ? `from ${formatInr(v.min)}` : null,
      perSqFt: v.rate ? `${formatInrExact(v.rate)}/sq ft` : null,
    }));
}

export function buildSellingNowCard(p: NormalizedProject, citySlug: string): SellingNowCard {
  const coords = resolveCoordinate(p.city_key, p.sector, p.micro_market);
  const view = resolveProjectView(p, {
    connectivity: nearbyConnectivity(p.city_key, coords.lat, coords.lng, coords.precision),
    landmarks: nearbyLandmarks(coords.lat, coords.lng, coords.precision),
    cityParam: citySlug,
  });
  const corridor = corridorLabel(p);

  const chips: string[] = [];
  if (corridor) chips.push(corridor);
  if (view.amenityCount >= 10) chips.push(`${view.amenityCount}+ amenities`);
  if (p.rera_status === "active") chips.push("RERA registered");
  if (view.investmentScore && chips.length < 3) chips.push(`Score ${view.investmentScore.score}/100`);

  return {
    project: p,
    href: `/project-listing/${citySlug}/${p.slug}`,
    location: [p.sector, corridor].filter(Boolean).join(", ") || p.city_name,
    statusLabel: INTENT_STATUS_LABEL[intentStatus(p)],
    possession: p.possession_text,
    configs: configsOf(p),
    units: specValue(p, /total\s*units|no\.?\s*of\s*units|units/i),
    landArea: specValue(p, /land\s*area|project\s*area|site\s*area|acre/i),
    chips: chips.slice(0, 3),
    score: view.investmentScore?.score ?? null,
    image: ownedProjectImage(p.city_key, p.slug),
    pin: coords.precision === "cityAnchor" ? null : { lat: coords.lat, lng: coords.lng },
  };
}

// ─────────────────────────────────────────────────────────── prices

export type PriceSplit = {
  residential: DeveloperPriceStats | null;
  commercial: DeveloperPriceStats | null;
  residentialTotal: number;
  commercialTotal: number;
};

/** The price snapshot on residential only, with commercial on its own line:
 *  a ₹9.9 Lakh retail unit is not a data point about DLF's homes. */
export function priceSplit(projects: NormalizedProject[], citySlug: (k: string) => string): PriceSplit {
  const res = projects.filter((p) => p.property_category !== "Commercial");
  const com = projects.filter((p) => p.property_category === "Commercial");
  return {
    residential: buildDeveloperProfile(res, citySlug).price,
    commercial: buildDeveloperProfile(com, citySlug).price,
    residentialTotal: res.length,
    commercialTotal: com.length,
  };
}

// ─────────────────────────────────────────────────────────── resale & rent

export type ResaleSummary = {
  sale: number;
  rent: number;
  /** Top sectors by listing count, each linked to its hub when it exists. */
  sectors: { label: string; sale: number; rent: number; buyHref: string | null; rentHref: string | null }[];
};

/** listing -> matched project slug, cached per segment array so the scan runs
 *  once per segment load rather than once per developer page. */
const matchCache = new WeakMap<RawHomzProperty[], Map<string, RawHomzProperty[]>>();

function listingsByProject(segment: RawHomzProperty[]): Map<string, RawHomzProperty[]> {
  const hit = matchCache.get(segment);
  if (hit) return hit;
  const out = new Map<string, RawHomzProperty[]>();
  for (const l of segment) {
    const name = extractProjectName(l);
    const key = name ? slugify(name) : "";
    if (key.length < 4) continue;
    const list = out.get(key);
    if (list) list.push(l);
    else out.set(key, [l]);
  }
  matchCache.set(segment, out);
  return out;
}

function sectorCounts(segment: RawHomzProperty[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const l of segment) {
    const t = listingSectorToken(l);
    if (t) m.set(t, (m.get(t) ?? 0) + 1);
  }
  return m;
}

/** Resale and rental listings whose project name matches one of these
 *  projects — the thing no portal's builder page shows. Exact slug match
 *  only: a prefix match would file "DLF Park Place" listings under "DLF
 *  Park", and a wrong count is worse than a lower one. */
export async function getDeveloperResale(projects: NormalizedProject[]): Promise<ResaleSummary | null> {
  const slugs = new Set(projects.filter((p) => p.city_key === "ggn").map((p) => p.slug));
  if (slugs.size === 0) return null;
  const [sale, rent] = await Promise.all([
    getSortedSegment(propertySegment("ggn", "Sale")).then((s) => s.sorted).catch(() => [] as RawHomzProperty[]),
    getSortedSegment(propertySegment("ggn", "Rent")).then((s) => s.sorted).catch(() => [] as RawHomzProperty[]),
  ]);
  const saleBy = listingsByProject(sale);
  const rentBy = listingsByProject(rent);
  const matchedSale = [...slugs].flatMap((s) => saleBy.get(s) ?? []);
  const matchedRent = [...slugs].flatMap((s) => rentBy.get(s) ?? []);
  if (matchedSale.length + matchedRent.length === 0) return null;

  const perSector = new Map<string, { sale: number; rent: number }>();
  for (const [list, key] of [[matchedSale, "sale"], [matchedRent, "rent"]] as const) {
    for (const l of list) {
      const t = listingSectorToken(l);
      if (!t) continue;
      const e = perSector.get(t) ?? { sale: 0, rent: 0 };
      e[key] += 1;
      perSector.set(t, e);
    }
  }
  // A sector hub renders only above MIN_HUB_LISTINGS across the whole segment
  // (lib/listings/facets.ts), so the link is offered only when that holds.
  const saleHub = sectorCounts(sale);
  const rentHub = sectorCounts(rent);
  const sectors = [...perSector.entries()]
    .sort((a, b) => b[1].sale + b[1].rent - (a[1].sale + a[1].rent))
    .slice(0, 5)
    .map(([token, c]) => ({
      label: sectorLabelFromToken(token),
      sale: c.sale,
      rent: c.rent,
      buyHref: (saleHub.get(token) ?? 0) >= MIN_HUB_LISTINGS ? `/buy-property/gurgaon/sector-${token}` : null,
      rentHref: (rentHub.get(token) ?? 0) >= MIN_HUB_LISTINGS ? `/rent-property/gurgaon/sector-${token}` : null,
    }));

  return { sale: matchedSale.length, rent: matchedRent.length, sectors };
}

// ─────────────────────────────────────────────────────────── launch tracker

export type TrackerRow = {
  date: string;
  headline: string;
  href: string;
  /** External news links carry rel="nofollow"; catalogue rows link internally. */
  external: boolean;
  source: string;
};

export const MIN_TRACKER_ROWS = 5;

// ─────────────────────────────────────────────────────────── about + faqs

export type DeveloperFootprint = {
  gurgaonCount: number;
  sectorCount: number;
  corridors: string[];
  newLaunch: number;
  underConstruction: number;
  ready: number;
  recentLaunches: string[];
};

export function developerFootprint(projects: NormalizedProject[]): DeveloperFootprint {
  const ggn = projects.filter((p) => p.city_key === "ggn");
  const sectors = new Set(ggn.map((p) => p.sector).filter(Boolean));
  const corridorCounts = new Map<string, number>();
  for (const p of ggn) {
    const c = corridorLabel(p);
    if (c) corridorCounts.set(c, (corridorCounts.get(c) ?? 0) + 1);
  }
  const by = (s: IntentStatus) => ggn.filter((p) => intentStatus(p) === s).length;
  return {
    gurgaonCount: ggn.length,
    sectorCount: sectors.size,
    corridors: [...corridorCounts.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c).slice(0, 4),
    newLaunch: by("new-launch") + by("upcoming"),
    underConstruction: by("under-construction"),
    ready: by("ready-to-move"),
    recentLaunches: sortByIntent(ggn)
      .filter((p) => intentStatus(p) === "new-launch")
      .slice(0, 3)
      .map((p) => p.project_name),
  };
}

function list(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/**
 * "About {Developer}", facts only: the verified entity record (when there is
 * one) and the developer's footprint in our own catalogue. Aims for 150-250
 * words when both exist; with no verified record it is the footprint alone,
 * which is shorter and still true.
 */
export function aboutParagraphs(
  name: string,
  facts: DeveloperProfileFacts | null,
  f: DeveloperFootprint
): string[] {
  const out: string[] = [];
  if (facts) {
    out.push(...facts.summary);
    const corp: string[] = [];
    if (facts.headquarters) corp.push(`${facts.officialName} is headquartered in ${facts.headquarters}`);
    if (facts.listedAs?.length) corp.push(`listed as ${list(facts.listedAs)}`);
    if (corp.length) out.push(`${corp.join(" and is ")}.`);
  }
  if (f.gurgaonCount > 0) {
    out.push(
      `In HomzRealtor's Gurgaon catalogue, ${name} has ${f.gurgaonCount} ${f.gurgaonCount === 1 ? "project" : "projects"} ` +
        `across ${f.sectorCount} ${f.sectorCount === 1 ? "sector" : "sectors"}` +
        (f.corridors.length ? `, concentrated on ${list(f.corridors)}` : "") +
        `. ${f.ready} ${f.ready === 1 ? "is" : "are"} ready to move, ${f.underConstruction} under construction and ` +
        `${f.newLaunch} newly launched or upcoming.` +
        (f.recentLaunches.length
          ? ` The most recent launches on record are ${list(f.recentLaunches)}.`
          : "")
    );
  }
  if (facts) {
    out.push(
      `${name}'s official website is ${facts.officialWebsite.replace(/^https?:\/\//, "").replace(/\/$/, "")}. ` +
        `Project facts on this page come from our catalogue and should be checked against the developer and the HARERA register before any booking.`
    );
  }
  return out;
}

export type DeveloperFaq = { q: string; a: string };

/** Visible FAQs, each answered from the records on this page. No FAQPage
 *  markup: the brief keeps these for readers only. */
export function developerFaqs(
  name: string,
  split: PriceSplit,
  footprint: DeveloperFootprint,
  sellingNow: NormalizedProject[],
  resale: ResaleSummary | null,
  reraActive: number
): DeveloperFaq[] {
  const faqs: DeveloperFaq[] = [];
  const r = split.residential;
  if (r) {
    faqs.push({
      q: `What is the price range of ${name} homes in Gurgaon?`,
      a:
        `Across the ${r.pricedCount} ${name} residential projects in our catalogue that carry a price (of ${split.residentialTotal}), ` +
        `entry asking prices run from ${formatInr(r.minInr)} to ${formatInr(r.maxInr)}, with a median of ${formatInr(r.medianInr)}` +
        (r.perSqFtInr ? ` and a median of about ${formatInrExact(r.perSqFtInr)} per sq ft where the size is confirmed` : "") +
        `. These are asking prices, not transacted prices.`,
    });
  }
  faqs.push({
    q: `Which ${name} projects in Gurgaon are selling now?`,
    a:
      sellingNow.length > 0
        ? `${sellingNow.length} ${name} ${sellingNow.length === 1 ? "project is" : "projects are"} new launches or under construction in our catalogue, led by ${list(sellingNow.slice(0, 3).map((p) => p.project_name))}.`
        : `None of ${name}'s projects in our catalogue is currently marked as a new launch or under construction.`,
  });
  faqs.push({
    q: `How do I check a ${name} project's RERA registration?`,
    a:
      `Search the project or promoter name on the HARERA portal (haryanarera.gov.in) and match the registration number, its validity date and the promoter's name to ${name}. ` +
      `${reraActive} of ${name}'s projects carry an active registration in our records; our record is a pointer, the portal is the authority.`,
  });
  if (resale) {
    faqs.push({
      q: `Can I buy or rent a resale flat in a ${name} project?`,
      a:
        `Yes. Our catalogue currently holds ${resale.sale} resale ${resale.sale === 1 ? "listing" : "listings"} and ${resale.rent} rental ${resale.rent === 1 ? "listing" : "listings"} ` +
        `in ${name} projects` +
        (resale.sectors.length ? `, most in ${list(resale.sectors.slice(0, 3).map((s) => s.label))}` : "") +
        `.`,
    });
  }
  if (footprint.gurgaonCount > 0) {
    faqs.push({
      q: `Where does ${name} build in Gurgaon?`,
      a:
        `Our catalogue places ${name}'s ${footprint.gurgaonCount} Gurgaon projects across ${footprint.sectorCount} sectors` +
        (footprint.corridors.length ? `, mostly along ${list(footprint.corridors)}` : "") +
        `.`,
    });
  }
  return faqs;
}

// ─────────────────────────────────────────────────────────── child views

/**
 * The intro for /developer/{slug}/{view} (brief §5): 60-100 words, every
 * sentence carrying this view's own figures. Deliberately no stock closing
 * line shared across views.
 */
export function viewIntro(
  name: string,
  view: Pick<DeveloperView, "label" | "intent" | "kind" | "slug">,
  projects: NormalizedProject[],
  profile: DeveloperProfile
): string {
  const n = projects.length;
  const parts: string[] = [];
  parts.push(
    `${name} has ${n} ${view.label.toLowerCase().replace(/projects$/, n === 1 ? "project" : "projects")} in Gurgaon in our catalogue: ${view.intent}.`
  );

  if (view.kind !== "status") {
    const by = (s: IntentStatus) => projects.filter((p) => intentStatus(p) === s).length;
    const mix = [
      [by("new-launch"), "newly launched"],
      [by("upcoming"), "upcoming"],
      [by("under-construction"), "under construction"],
      [by("ready-to-move"), "ready to move"],
    ].filter(([c]) => (c as number) > 0) as [number, string][];
    if (mix.length) parts.push(`By stage, ${list(mix.map(([c, l]) => `${c} ${l}`))}.`);
  } else {
    const newest = projects.slice(0, 3).map((p) => p.project_name);
    if (newest.length) parts.push(`The most recently updated are ${list(newest)}.`);
  }

  if (profile.price) {
    parts.push(
      `Entry asking prices run from ${formatInr(profile.price.minInr)} to ${formatInr(profile.price.maxInr)}, ` +
        `median ${formatInr(profile.price.medianInr)} across ${profile.price.pricedCount} priced` +
        (profile.price.perSqFtInr ? `, about ${formatInrExact(profile.price.perSqFtInr)} per sq ft where the size is confirmed` : "") +
        `.`
    );
  } else {
    const priced = projects.filter((p) => p.min_price_inr).length;
    parts.push(
      priced > 0
        ? `${priced} of the ${n} carry an asking price; the rest are price on request.`
        : `All ${n} are price on request in our records.`
    );
  }

  if (view.kind !== "corridor") {
    const corridors = new Map<string, number>();
    for (const p of projects) {
      const c = corridorLabel(p);
      if (c) corridors.set(c, (corridors.get(c) ?? 0) + 1);
    }
    const top = [...corridors.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2);
    if (top.length) parts.push(`Most sit on ${list(top.map(([c, k]) => `${c} (${k})`))}.`);
  }
  const sectors = profile.sectors.slice(0, 2);
  if (sectors.length) {
    parts.push(
      `${profile.sectors.length === 1 ? "The one sector" : `Of ${profile.sectors.length} sectors, the busiest ${sectors.length === 1 ? "is" : "are"}`} ${list(
        sectors.map((s) => `${s.label} (${s.count})`)
      )}.`
    );
  }
  if (profile.reraWithId > 0) {
    parts.push(`${profile.reraActive} carry an active HARERA registration in our records.`);
  }
  return parts.join(" ");
}
