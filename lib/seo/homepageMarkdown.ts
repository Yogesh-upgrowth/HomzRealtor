import { HOME_FAQS } from "@/lib/content/homeFaq";

// Markdown representation of the homepage for `Accept: text/markdown`
// negotiation (see middleware.ts and https://acceptmarkdown.com). Mirrors
// the same real, evergreen copy the homepage renders (components/Hero.tsx's
// headline/trust stats, components/Home/HomeFaq.tsx's FAQ content) rather
// than live-fetched listings, which change per request and aren't worth
// duplicating the page's own data-fetching layer to mirror here.
export function getHomepageMarkdown(): string {
  const faqSection = HOME_FAQS.map((f) => `### ${f.q}\n\n${f.a}`).join("\n\n");

  return `# HomzRealtor

Homes you can trust, in the city you love.

Buy, rent or sell — discover verified listings, expert guidance, and properties that feel like home. Trusted by 25,500+ buyers across Gurgaon.

## Explore

- [Buy Property](/buy-property)
- [Rent Property](/rent-property)
- [Commercial](/commercial)
- [Projects](/project-listing)
- [Plots & Land](/plots-and-lands)
- [Browse by Sector](/project-listing/gurgaon/sectors)
- [Developers](/developer)

## Why HomzRealtor

- 25,500+ Happy Customers
- 45 Mn+ Sq.ft. Area Sold
- 500+ Skilled Professionals
- 750+ Channel Associates

## Frequently Asked Questions

${faqSection}

## For developers & agents

Read-only public API and agent guidance: [/llms.txt](/llms.txt) · [/openapi.json](/openapi.json) · [/developers](/developers)

---

Full list of indexable pages: [/sitemap.xml](/sitemap.xml)
`;
}
