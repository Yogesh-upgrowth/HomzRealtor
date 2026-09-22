// Developer x Intent x Location: which child pages exist, and which are
// indexable (2026-09-22).
//
// The architecture is generic by construction. Nothing here names DLF; DLF is
// simply the first developer with enough inventory to fill every view. Swap
// the slug and M3M, Emaar, Adani and Central Park get the same set for free.
//
//   /developer/{slug}                      all projects        (head term)
//   /developer/{slug}/residential          residential intent
//   /developer/{slug}/commercial           commercial intent
//   /developer/{slug}/new-launch           new / upcoming
//   /developer/{slug}/ready-to-move        completed
//   /developer/{slug}/luxury               premium intent
//   /developer/{slug}/{corridor}           developer + location
//
// ONE QUERY FAMILY, ONE PAGE. The parent owns "DLF projects in Gurgaon" and
// every paraphrase of it. That is why there is no blog article competing for
// the same head term — a /blog/best-dlf-projects-gurgaon would cannibalise the
// hub, and the hub has the inventory.
//
// INDEXABILITY IS EARNED, NOT AUTOMATIC, and this is the part that keeps the
// architecture from recreating the faceted-navigation problem. A developer
// with one project on a corridor does not get a corridor page offered to
// Google merely because the URL can be constructed. The thresholds below are
// deliberately higher than the parent's, because a child page competes with
// its own parent for attention and has to justify existing separately.
//
// Below threshold, the view still RENDERS — the visitor gets their filtered
// list, the links stay crawlable, `follow` is preserved — it is simply not
// offered for indexing and not placed in the sitemap. Rendering and
// advertising are different things.

import type { NormalizedProject } from "./normalize";
import { projectStatusKind } from "./projectStatus";
import { GURGAON_CORRIDORS } from "@/lib/listings/listingLocation";

/** Luxury is ₹5 Cr and above, the same definition the rest of the site uses
 *  (lib/content/catalogueStats.ts's gurgaonLuxuryProjects). Reused rather than
 *  redefined so a developer's luxury page and the citywide luxury figures can
 *  never disagree about what the word means. */
export const LUXURY_MIN_INR = 50_000_000;

export type DeveloperViewKind = "category" | "status" | "price" | "corridor";

export type DeveloperView = {
  /** URL segment after the developer slug. */
  slug: string;
  kind: DeveloperViewKind;
  /** H1 fragment: "DLF {label} in Gurgaon". */
  label: string;
  /** Short intent description for the meta and the intro. */
  intent: string;
  filter: (p: NormalizedProject) => boolean;
};

/**
 * The five fixed views every developer can have.
 *
 * Corridor views are generated per developer from GURGAON_CORRIDORS rather
 * than listed here, because which corridors a developer builds on is a fact
 * about them, not a constant.
 */
export const FIXED_DEVELOPER_VIEWS: DeveloperView[] = [
  {
    slug: "residential",
    kind: "category",
    label: "Residential Projects",
    intent: "apartments, floors and villas",
    filter: (p) => p.property_category === "Residential",
  },
  {
    slug: "commercial",
    kind: "category",
    label: "Commercial Projects",
    intent: "offices, retail and SCO plots",
    filter: (p) => p.property_category === "Commercial",
  },
  {
    slug: "new-launch",
    kind: "status",
    label: "New Launch Projects",
    intent: "recently launched and upcoming developments",
    filter: (p) => projectStatusKind(p.project_status) === "new-launch",
  },
  {
    slug: "ready-to-move",
    kind: "status",
    label: "Ready to Move Projects",
    intent: "completed projects with no construction wait",
    filter: (p) => projectStatusKind(p.project_status) === "ready-to-move",
  },
  {
    slug: "luxury",
    kind: "price",
    label: "Luxury Projects",
    intent: "projects with an entry price of ₹5 crore or above",
    filter: (p) => p.min_price_inr != null && p.min_price_inr >= LUXURY_MIN_INR,
  },
];

const FIXED_BY_SLUG = new Map(FIXED_DEVELOPER_VIEWS.map((v) => [v.slug, v]));

/** The corridor a project sits on, by the same patterns the listing hubs use. */
export function projectCorridorSlug(p: NormalizedProject): string | null {
  const blob = `${p.sector ?? ""} ${p.micro_market ?? ""} ${p.project_name ?? ""}`;
  return GURGAON_CORRIDORS.find((c) => c.match.test(blob))?.slug ?? null;
}

export function corridorView(slug: string): DeveloperView | null {
  const corridor = GURGAON_CORRIDORS.find((c) => c.slug === slug);
  if (!corridor) return null;
  return {
    slug: corridor.slug,
    kind: "corridor",
    label: `Projects on ${corridor.label}`,
    intent: `developments along ${corridor.label}`,
    filter: (p) => projectCorridorSlug(p) === corridor.slug,
  };
}

/** Resolve any child segment to a view, fixed or corridor. */
export function resolveDeveloperView(slug: string): DeveloperView | null {
  const key = String(slug ?? "").trim().toLowerCase();
  return FIXED_BY_SLUG.get(key) ?? corridorView(key);
}

/**
 * Minimum projects before a child page is offered to Google.
 *
 * Higher for a corridor than for a category, because a corridor page is the
 * narrowest slice and the one most likely to be thin. These are starting
 * values, not laws of nature — Search Console impressions on the first cohort
 * are what should move them, and the numbers live here so moving them is one
 * edit rather than a hunt.
 */
export const VIEW_INDEX_THRESHOLDS: Record<DeveloperViewKind, number> = {
  category: 4,
  status: 4,
  price: 4,
  corridor: 5,
};

export type ViewIndexDecision = {
  indexable: boolean;
  count: number;
  threshold: number;
  /** Why not, when not. Rendered on the page itself, not just in a robots tag. */
  reason: string | null;
};

/**
 * Should this developer view be indexed?
 *
 * Two conditions, both required:
 *
 *   1. Enough projects to clear the view's threshold.
 *   2. Enough of them carrying a price that the page can say something a
 *      filtered list could not. A view of nine projects where none has a price
 *      is a list of links — the parent page already has that list, and Google
 *      does not need it twice.
 *
 * The second condition is what the checklist means by "unique data", and it is
 * the one that would otherwise be forgotten: counting records is easy, and a
 * page can clear a count while having nothing to show.
 */
export function decideViewIndexable(
  view: DeveloperView,
  projects: NormalizedProject[]
): ViewIndexDecision {
  const threshold = VIEW_INDEX_THRESHOLDS[view.kind];
  const count = projects.length;

  if (count < threshold) {
    return {
      indexable: false,
      count,
      threshold,
      reason:
        count === 0
          ? `We list no ${view.label.toLowerCase()} for this developer right now.`
          : `Only ${count} project${count === 1 ? "" : "s"} here, below the ${threshold} we require before offering a page like this to search engines.`,
    };
  }

  const priced = projects.filter((p) => p.min_price_inr != null && p.min_price_inr > 0).length;
  if (priced < 2) {
    return {
      indexable: false,
      count,
      threshold,
      reason: `${count} projects, but only ${priced} carries a price, so this page cannot tell you anything the full portfolio page does not.`,
    };
  }

  return { indexable: true, count, threshold, reason: null };
}

export type AvailableView = {
  view: DeveloperView;
  count: number;
  indexable: boolean;
};

/**
 * Every view worth linking for a developer, with its count.
 *
 * Used for the intent navigation under the hero and for the sitemap. A view
 * with no projects at all is omitted entirely — a "Commercial Projects (0)"
 * tab is a dead end for a visitor and a thin page for a crawler.
 *
 * Note the two different bars: a view is LINKED at one project (it is a real,
 * useful filter for someone browsing) and INDEXED only at the threshold. The
 * intent nav is a navigation aid first; the SEO value is a consequence of it
 * being crawlable, not its purpose.
 */
export function availableDeveloperViews(projects: NormalizedProject[]): AvailableView[] {
  const out: AvailableView[] = [];

  for (const view of FIXED_DEVELOPER_VIEWS) {
    const matched = projects.filter(view.filter);
    if (matched.length === 0) continue;
    out.push({
      view,
      count: matched.length,
      indexable: decideViewIndexable(view, matched).indexable,
    });
  }

  // Corridors, ordered by how much the developer actually builds there.
  const byCorridor = new Map<string, NormalizedProject[]>();
  for (const p of projects) {
    const slug = projectCorridorSlug(p);
    if (!slug) continue;
    if (!byCorridor.has(slug)) byCorridor.set(slug, []);
    byCorridor.get(slug)!.push(p);
  }
  const corridorEntries = Array.from(byCorridor.entries()).sort((a, b) => b[1].length - a[1].length);
  for (const [slug, matched] of corridorEntries) {
    const view = corridorView(slug);
    if (!view) continue;
    out.push({
      view,
      count: matched.length,
      indexable: decideViewIndexable(view, matched).indexable,
    });
  }

  return out;
}

/** Projects in a view, in the order the pages render them: best-presented
 *  first, then priced, then alphabetical. Same ordering as the area blocks,
 *  and for the same reason — it is a presentation order, not a quality claim. */
export function projectsForView(
  view: DeveloperView,
  projects: NormalizedProject[]
): NormalizedProject[] {
  return projects.filter(view.filter).sort((a, b) => {
    const ai = a.images.length > 0 ? 0 : 1;
    const bi = b.images.length > 0 ? 0 : 1;
    if (ai !== bi) return ai - bi;
    const ap = a.min_price_inr != null ? 0 : 1;
    const bp = b.min_price_inr != null ? 0 : 1;
    if (ap !== bp) return ap - bp;
    return a.project_name.localeCompare(b.project_name);
  });
}
