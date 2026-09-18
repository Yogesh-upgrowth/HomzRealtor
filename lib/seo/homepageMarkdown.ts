import { HOME_FAQS } from "@/lib/content/homeFaq";

// Markdown representation of the homepage for `Accept: text/markdown`
// negotiation (see middleware.ts and https://acceptmarkdown.com). Mirrors
// the same real, evergreen copy the homepage renders (components/Hero.tsx's
// headline, components/Home/HomeFaq.tsx's FAQ content) rather than
// live-fetched listings, which change per request and aren't worth
// duplicating the page's own data-fetching layer to mirror here.
//
// Owner recheck (HOMZ-LIVE-RECHECK-AND-OWNER-INPUTS-2026-09-17, P1-G):
// this had drifted out of sync with Hero.tsx in three ways -- an older
// headline missing "Gurgaon" (fixed 2026-09-07 in Hero.tsx but never
// mirrored here), the same unsubstantiated "25,500+ buyers"/trust-stats
// claims removed from Hero.tsx per that audit, and a stale /developers
// link left over from before that path was repointed at the developer
// directory instead of API docs. Keep this in sync with Hero.tsx by hand
// -- there's no shared source between the two.
export function getHomepageMarkdown(): string {
  const faqSection = HOME_FAQS.map((f) => `### ${f.q}\n\n${f.a}`).join("\n\n");

  return `# HomzRealtor

Homes you can trust, in Gurgaon, the city you love.

Buy, rent or sell, discover verified listings, expert guidance, and properties that feel like home.

## Explore

- [Buy Property](/buy-property)
- [Rent Property](/rent-property)
- [Commercial](/commercial)
- [Projects](/project-listing)
- [Plots & Land](/plots-and-lands)
- [Browse by Sector](/project-listing/gurgaon/sectors)
- [Developers](/developer)

## Frequently Asked Questions

${faqSection}

## For developers & agents

Read-only public API and agent guidance: [/llms.txt](/llms.txt) · [/openapi.json](/openapi.json) · [/api-docs](/api-docs)

---

Full list of indexable pages: [/sitemap.xml](/sitemap.xml)
`;
}
