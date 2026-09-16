// DEV-05 (2026-09-16): confirmed live — all 83 sampled transaction detail
// pages had zero listing-specific structured data (hub-level
// CollectionPage/ItemList schema exists, but no per-property markup at
// all). Emits BreadcrumbList + RealEstateListing (+ FAQPage when real FAQs
// exist), built only from fields PropertyView actually carries — no
// Offer/price block when the listing has no confirmed price ("Unknown
// price is not an Offer with zero price" — DEV-05's own guardrail), no
// invented address components.

import type { PropertyView } from "@/lib/intelligence/property-view";

const SITE = "https://www.homzrealtor.com";

const ROUTE_BASE: Record<PropertyView["category"], string> = {
  Sale: "buy-property",
  Rent: "rent-property",
  Pg: "pg-property",
  Commercial: "commercial",
};

const CATEGORY_LABEL: Record<PropertyView["category"], string> = {
  Sale: "Buy Property",
  Rent: "Rent Property",
  Pg: "PG Accommodation",
  Commercial: "Commercial Property",
};

// Same approach as PaginatedListingPage.tsx's own safeJson() — split/join on
// the actual character code rather than a regex literal containing it, to
// avoid embedding a raw U+2028/U+2029 line/paragraph separator in this
// source file.
function safeJson(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .split(String.fromCharCode(0x2028))
    .join("\\u2028")
    .split(String.fromCharCode(0x2029))
    .join("\\u2029");
}

export default function PropertyJsonLd({ view }: { view: PropertyView }) {
  const routeBase = ROUTE_BASE[view.category];
  const pageUrl = `${SITE}/${routeBase}/${view.citySlug}/${view.slug}`;

  const listing: Record<string, unknown> = {
    "@type": "RealEstateListing",
    name: view.title,
    url: pageUrl,
    ...(view.about[0] ? { description: view.about[0] } : {}),
    ...(view.images.length ? { image: view.images.slice(0, 5) } : {}),
    address: {
      "@type": "PostalAddress",
      addressLocality: view.location,
      addressCountry: "IN",
    },
  };

  // Never an Offer with a fabricated/zero price — omit the whole block when
  // the listing itself has no confirmed price, per DEV-05's own guardrail.
  if (view.hasPrice) {
    listing.offers = {
      "@type": "Offer",
      priceCurrency: "INR",
      price: view.priceText,
      availability: "https://schema.org/InStock",
    };
  }

  const graph: Record<string, unknown>[] = [
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE },
        { "@type": "ListItem", position: 2, name: CATEGORY_LABEL[view.category], item: `${SITE}/${routeBase}` },
        { "@type": "ListItem", position: 3, name: view.title, item: pageUrl },
      ],
    },
    listing,
  ];

  if (view.faq.length > 0) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: view.faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    });
  }

  const structuredData = { "@context": "https://schema.org", "@graph": graph };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJson(structuredData) }}
    />
  );
}
