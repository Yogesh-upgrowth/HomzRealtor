// Which commercial hub each editorial piece should point at (2026-09-21).
//
// The 25 guides in lib/content/blog/ are the site's main link-earning asset,
// and before this they funnelled almost nowhere: 11 generic /buy-property
// links, 3 links to a facet page, and not one link to anything under
// /rent-property or to any area page. A guide titled "Best projects on Dwarka
// Expressway" sent its reader to the citywide hub, where they had to filter
// from scratch.
//
// So the link targets are derived from what the post is actually about, and
// rendered as a block on every post rather than hand-written into 25 files.
// Hand-editing would mean 25 diffs against prose that carries strict length
// validation (see blogPostSchema), and the next post added would start with
// none of it.
//
// Every target here is a page that exists regardless of current inventory —
// the static facets and the seven hand-written corridor hubs, which are exempt
// from the sector inventory floor precisely so static content can link them
// without a live check. Nothing here can point at a 404. See the gate note in
// components/PropertyListing/FacetedListingPage.tsx.

export type HubLink = { href: string; label: string };

type Rule = {
  /** Tested against the post's slug and primary keyword, lowercased. */
  match: RegExp;
  links: HubLink[];
};

const RULES: Rule[] = [
  // --- corridors -----------------------------------------------------------
  {
    match: /dwarka[\s-]*expressway/,
    links: [
      { href: "/buy-property/gurgaon/dwarka-expressway", label: "Property for sale on Dwarka Expressway" },
      { href: "/rent-property/gurgaon/dwarka-expressway", label: "Rentals on Dwarka Expressway" },
    ],
  },
  {
    match: /golf[\s-]*course[\s-]*(extension|ext)/,
    links: [
      { href: "/buy-property/gurgaon/golf-course-extension-road", label: "Property for sale on Golf Course Extension Road" },
      { href: "/rent-property/gurgaon/golf-course-extension-road", label: "Rentals on Golf Course Extension Road" },
    ],
  },
  {
    // Deliberately after the Extension rule — "Golf Course Road" is a
    // substring of "Golf Course Extension Road" in everyday writing, and the
    // two are different corridors with different rates.
    match: /golf[\s-]*course[\s-]*road/,
    links: [
      { href: "/buy-property/gurgaon/golf-course-road", label: "Property for sale on Golf Course Road" },
      { href: "/rent-property/gurgaon/golf-course-road", label: "Rentals on Golf Course Road" },
    ],
  },
  {
    match: /new[\s-]*gurgaon|new[\s-]*gurugram/,
    links: [
      { href: "/buy-property/gurgaon/new-gurgaon", label: "Property for sale in New Gurgaon" },
      { href: "/rent-property/gurgaon/new-gurgaon", label: "Rentals in New Gurgaon" },
    ],
  },
  {
    match: /sohna[\s-]*road/,
    links: [
      { href: "/buy-property/gurgaon/sohna-road", label: "Property for sale on Sohna Road" },
      { href: "/rent-property/gurgaon/sohna-road", label: "Rentals on Sohna Road" },
    ],
  },
  {
    match: /southern[\s-]*peripheral|\bspr\b/,
    links: [
      { href: "/buy-property/gurgaon/southern-peripheral-road", label: "Property for sale on Southern Peripheral Road" },
      { href: "/rent-property/gurgaon/southern-peripheral-road", label: "Rentals on Southern Peripheral Road" },
    ],
  },

  // --- configuration and budget -------------------------------------------
  {
    match: /\b3[\s-]*bhk\b/,
    links: [
      { href: "/buy-property/gurgaon/3-bhk", label: "3 BHK flats for sale in Gurgaon" },
      { href: "/rent-property/gurgaon/3-bhk", label: "3 BHK flats for rent in Gurgaon" },
    ],
  },
  {
    match: /\b4[\s-]*bhk\b/,
    links: [
      { href: "/buy-property/gurgaon/4-bhk", label: "4 BHK flats for sale in Gurgaon" },
      { href: "/rent-property/gurgaon/4-bhk", label: "4 BHK flats for rent in Gurgaon" },
    ],
  },
  {
    match: /under[\s-]*1[\s-]*crore|under[\s-]*₹?1[\s-]*cr/,
    links: [{ href: "/buy-property/gurgaon/under-1-crore", label: "Flats under ₹1 crore in Gurgaon" }],
  },
  {
    match: /under[\s-]*2[\s-]*crore|under[\s-]*₹?2[\s-]*cr/,
    links: [{ href: "/buy-property/gurgaon/under-2-crore", label: "Property under ₹2 crore in Gurgaon" }],
  },
  {
    match: /ready[\s-]*to[\s-]*move/,
    links: [{ href: "/buy-property/gurgaon/ready-to-move", label: "Ready-to-move flats in Gurgaon" }],
  },
  {
    match: /\bplots?\b/,
    links: [{ href: "/buy-property/gurgaon/plots", label: "Plots for sale in Gurgaon" }],
  },
  {
    match: /luxury/,
    links: [
      { href: "/buy-property/gurgaon/under-2-crore", label: "Property under ₹2 crore in Gurgaon" },
      { href: "/rent-property/gurgaon/luxury-rentals", label: "Luxury flats for rent in Gurgaon" },
    ],
  },
];

/** Shown on every post, after whatever the rules matched. */
const ALWAYS: HubLink[] = [
  { href: "/property-rates-in-gurgaon", label: "Gurgaon property rates, sector by sector" },
  { href: "/buy-property", label: "All property for sale in Gurgaon" },
  { href: "/rent-property", label: "All rentals in Gurgaon" },
];

/**
 * Hub links for a post, most specific first, de-duplicated.
 *
 * `extra` carries anything the post itself names — currently its tags — so a
 * guide tagged "Sohna Road" picks that up even if the slug does not say so.
 */
export function hubLinksForPost(
  slug: string,
  primaryKeyword: string,
  extra: string[] = []
): HubLink[] {
  const haystack = [slug, primaryKeyword, ...extra].join(" ").toLowerCase();

  const matched: HubLink[] = [];
  for (const rule of RULES) {
    if (rule.match.test(haystack)) matched.push(...rule.links);
  }

  const seen = new Set<string>();
  const out: HubLink[] = [];
  for (const link of [...matched, ...ALWAYS]) {
    if (seen.has(link.href)) continue;
    seen.add(link.href);
    out.push(link);
  }
  // Six is the point where a link block stops guiding and starts being a
  // footer. The rules are ordered most-specific-first, so the cut falls on the
  // least relevant.
  return out.slice(0, 6);
}
