// Computed developer portfolio intelligence (2026-09-19).
//
// Audit item 9: "Developer hubs cap at 9 projects with a 'View all' that goes
// to a filtered param URL, and carry no profile content." Two separate
// problems sat behind that sentence:
//
//   1. Crawl. A builder with 40 projects linked 9 of them. The rest were
//      reachable only through /project-listing?builder=<slug>, a query-param
//      view no crawler is obliged to follow and which this site does not
//      server-render as anchors. The remaining projects had no path in from
//      the one page that is *about* their builder.
//   2. Substance. A one-sentence intro over a card grid is the thin page the
//      audit describes. The pages that outrank these carry the builder's
//      actual delivery record: what they cost, where they build, how much is
//      finished, how much is registered.
//
// This file answers (2) from the catalogue the site already holds. Same rules
// as sectorContext.ts, deliberately: nothing copied, nothing paraphrased,
// nothing model-generated, every figure derived from records on hand, every
// field nullable so a builder with four projects renders a short honest page
// rather than a padded one. (1) is fixed in the page itself, which now links
// every project by name.

import { slugify, type NormalizedProject } from "./normalize";

export type DeveloperPriceStats = {
  minInr: number;
  maxInr: number;
  medianInr: number;
  /** How many projects carried a parsed entry price — always rendered next to
   *  the median so a reader knows what it rests on. */
  pricedCount: number;
  totalCount: number;
  perSqFtInr: number | null;
  perSqFtSample: number;
};

export type DeveloperLocation = {
  label: string;
  /** Sector pages only exist for Gurgaon; null elsewhere, and the page then
   *  renders the label as plain text rather than a dead link. */
  href: string | null;
  count: number;
};

export type DeveloperProfile = {
  price: DeveloperPriceStats | null;
  /** Possession mix. `unknown` is carried explicitly so the three known
   *  buckets are never silently presented as the whole portfolio. */
  readyToMove: number;
  underConstruction: number;
  newLaunch: number;
  statusUnknown: number;
  /** Projects carrying an active HARERA registration, and the total that
   *  carry any registration id at all. A well-formed id is not the same as a
   *  live registration — see ReraBadge. */
  reraActive: number;
  reraWithId: number;
  sectors: DeveloperLocation[];
  microMarkets: { name: string; count: number }[];
  /** Property types across the portfolio, most common first. */
  types: { label: string; count: number }[];
  sizeRange: { minSqFt: number; maxSqFt: number; sample: number } | null;
};

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

function priceStats(projects: NormalizedProject[]): DeveloperPriceStats | null {
  const priced = projects
    .map((p) => p.min_price_inr)
    .filter((v): v is number => typeof v === "number" && Number.isFinite(v) && v > 0);

  // Same floor as sectorContext: below four, a "median" is noise wearing the
  // clothes of an insight.
  if (priced.length < 4) return null;

  // Per-sq-ft needs price and a *confirmed* size on the same record.
  // size_unit is null when normalize.ts could not confirm the unit, and
  // records in sq.yd would otherwise be divided as though they were sq.ft.
  const rates: number[] = [];
  for (const p of projects) {
    if (
      typeof p.min_price_inr === "number" && p.min_price_inr > 0 &&
      typeof p.min_size === "number" && p.min_size > 0 &&
      p.size_unit === "sq.ft"
    ) {
      rates.push(Math.round(p.min_price_inr / p.min_size));
    }
  }

  return {
    minInr: Math.min(...priced),
    maxInr: Math.max(...priced),
    medianInr: median(priced)!,
    pricedCount: priced.length,
    totalCount: projects.length,
    perSqFtInr: rates.length >= 4 ? median(rates) : null,
    perSqFtSample: rates.length,
  };
}

function countBy<T>(items: T[], key: (t: T) => string | null): Map<string, number> {
  const m = new Map<string, number>();
  for (const it of items) {
    const k = key(it);
    if (!k) continue;
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return m;
}

export function buildDeveloperProfile(
  projects: NormalizedProject[],
  /** Canonical city slug per city key, injected rather than imported so this
   *  module stays free of the projects.ts data layer and unit-testable. */
  citySlug: (cityKey: string) => string
): DeveloperProfile {
  const statusOf = (p: NormalizedProject) => (p.project_status || "").toLowerCase();
  const ready = projects.filter((p) => /ready|rtm|completed|delivered/.test(statusOf(p)));
  const uc = projects.filter((p) => /under.?construction|ongoing/.test(statusOf(p)));
  const launch = projects.filter((p) => /new.?launch|launch/.test(statusOf(p)));

  // Sector counts, Gurgaon-linkable only. A sector page exists per
  // /project-listing/[city]/sectors/[sector]; for other cities there is no
  // such route, so those labels render unlinked.
  const sectorMap = new Map<string, { label: string; cityKey: string; count: number }>();
  for (const p of projects) {
    if (!p.sector) continue;
    const key = `${p.city_key}:${slugify(p.sector)}`;
    const entry = sectorMap.get(key);
    if (entry) entry.count += 1;
    else sectorMap.set(key, { label: p.sector, cityKey: p.city_key, count: 1 });
  }

  const sizes = projects
    .filter((p) => p.size_unit === "sq.ft")
    .map((p) => [p.min_size, p.max_size] as const)
    .filter(([lo]) => typeof lo === "number" && lo > 0);

  return {
    price: priceStats(projects),
    readyToMove: ready.length,
    underConstruction: uc.length,
    newLaunch: launch.length,
    statusUnknown: projects.length - ready.length - uc.length - launch.length,
    reraActive: projects.filter((p) => p.rera_status === "active").length,
    reraWithId: projects.filter((p) => Boolean(p.rera_id)).length,
    sectors: [...sectorMap.values()]
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
      .slice(0, 12)
      .map((s) => ({
        label: s.label,
        href:
          s.cityKey === "ggn"
            ? `/project-listing/${citySlug(s.cityKey)}/sectors/${slugify(s.label)}`
            : null,
        count: s.count,
      })),
    microMarkets: [...countBy(projects, (p) => p.micro_market).entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
      .slice(0, 8),
    types: [...countBy(projects, (p) => p.property_type).entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
      .slice(0, 6),
    sizeRange: sizes.length
      ? {
          minSqFt: Math.min(...sizes.map(([lo]) => lo as number)),
          maxSqFt: Math.max(
            ...sizes.map(([lo, hi]) => (typeof hi === "number" && hi > 0 ? hi : (lo as number)))
          ),
          sample: sizes.length,
        }
      : null,
  };
}

/**
 * FAQs answered entirely from the computed profile.
 *
 * Only questions the data can answer are emitted — this feeds FAQPage markup,
 * and an answer that hedges because the figure is missing is worse than no
 * question at all. The questions mirror what these searches actually carry:
 * "is <builder> RERA approved", "<builder> price list", "where does <builder>
 * build", "is <builder> ready to move".
 */
export function buildDeveloperFaqs(
  name: string,
  cityLabel: string,
  profile: DeveloperProfile,
  formatInr: (n: number | null | undefined) => string | null
): { q: string; a: string }[] {
  const faqs: { q: string; a: string }[] = [];
  const total =
    profile.readyToMove + profile.underConstruction + profile.newLaunch + profile.statusUnknown;

  if (profile.price) {
    const { minInr, maxInr, medianInr, pricedCount, totalCount } = profile.price;
    const unpriced = totalCount - pricedCount;
    faqs.push({
      q: `What is the price range of ${name} projects?`,
      a:
        `Across the ${pricedCount} ${name} project${pricedCount === 1 ? "" : "s"} on HomzRealtor that carry a listed entry price, ` +
        `prices start between ${formatInr(minInr)} and ${formatInr(maxInr)}, with a median of ${formatInr(medianInr)}. ` +
        (unpriced > 0
          ? `A further ${unpriced} ${unpriced === 1 ? "is" : "are"} listed as price on request. `
          : "") +
        `These are asking prices from our catalogue, not transacted prices, and they change as inventory moves.`,
    });
  }

  if (profile.price?.perSqFtInr) {
    faqs.push({
      q: `What is the per sq ft rate for ${name} projects?`,
      a: `Across the ${profile.price.perSqFtSample} ${name} projects listing both a price and a confirmed size, the median works out to about ₹${profile.price.perSqFtInr.toLocaleString("en-IN")} per sq ft. Individual projects sit either side of that depending on sector, configuration and stage of construction.`,
    });
  }

  if (total > 0 && profile.readyToMove + profile.underConstruction + profile.newLaunch > 0) {
    const parts: string[] = [];
    if (profile.readyToMove) parts.push(`${profile.readyToMove} ready to move`);
    if (profile.underConstruction) parts.push(`${profile.underConstruction} under construction`);
    if (profile.newLaunch) parts.push(`${profile.newLaunch} newly launched`);
    faqs.push({
      q: `Are there ready-to-move ${name} projects?`,
      a:
        `Of the ${total} ${name} project${total === 1 ? "" : "s"} HomzRealtor tracks, ${parts.join(", ")}.` +
        (profile.statusUnknown > 0
          ? ` The remaining ${profile.statusUnknown} do not carry a construction status in our records, so confirm those with an advisor rather than assuming one.`
          : ""),
    });
  }

  if (profile.reraWithId > 0) {
    faqs.push({
      q: `Are ${name} projects RERA registered?`,
      a:
        `${profile.reraWithId} of the ${total} ${name} project${total === 1 ? "" : "s"} listed here carry a HARERA registration number, and ${profile.reraActive} of those show as currently active in the records available to us. ` +
        `Registration is per project and per phase, not per developer, so check the number on the project page against the official HARERA portal before any payment — a number in marketing material is not the same as a live, matching registration.`,
    });
  }

  if (profile.sectors.length > 0) {
    faqs.push({
      q: `Where in ${cityLabel} does ${name} build?`,
      a: `Their listed projects concentrate in ${profile.sectors
        .slice(0, 5)
        .map((s) => `${s.label} (${s.count})`)
        .join(", ")}${profile.sectors.length > 5 ? ", among other locations" : ""}.`,
    });
  }

  if (profile.sizeRange && profile.sizeRange.sample >= 3) {
    faqs.push({
      q: `What unit sizes do ${name} projects offer?`,
      a: `Listed sizes run from about ${profile.sizeRange.minSqFt.toLocaleString("en-IN")} to ${profile.sizeRange.maxSqFt.toLocaleString("en-IN")} sq ft across the ${profile.sizeRange.sample} projects carrying a confirmed size. Configurations vary by project and phase.`,
    });
  }

  return faqs;
}
