// DEV-05 (2026-09-16): confirmed live — all 83 sampled transaction detail
// pages had zero listing-specific structured data (hub-level
// CollectionPage/ItemList schema exists, but no per-property markup at
// all). Emits BreadcrumbList + RealEstateListing, built only from fields PropertyView actually carries — no
// Offer/price block when the listing has no confirmed price ("Unknown
// price is not an Offer with zero price" — DEV-05's own guardrail), no
// invented address components.

import type { PropertyView } from "@/lib/intelligence/property-view";
import type { ListingRecord } from "@/lib/intelligence/get-listing-record";

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

export default function PropertyJsonLd({
  view,
  record,
}: {
  view: PropertyView;
  record?: ListingRecord;
}) {
  const routeBase = ROUTE_BASE[view.category];
  const pageUrl = `${SITE}/${routeBase}/${view.citySlug}/${view.slug}`;

  // 2026-09-19: the listing node now names HomzRealtor as the broker and
  // carries Homz's own identifier and description. Previously it was an
  // anonymous RealEstateListing whose description was the source portal's
  // prose -- markup indistinguishable from the posting it was rebuilt from.
  // `provider` is the schema.org property for the agent responsible for the
  // listing; `identifier` is the reference a caller can quote.
  const homzAgent = {
    "@type": "RealEstateAgent",
    "@id": `${SITE}/#organization`,
    name: "HomzRealtor",
    url: SITE,
  };

  const listing: Record<string, unknown> = {
    "@type": "RealEstateListing",
    name: view.title,
    url: pageUrl,
    provider: homzAgent,
    ...(record?.listingId
      ? {
          identifier: {
            "@type": "PropertyValue",
            propertyID: "HomzRealtor listing ID",
            value: record.listingId,
          },
        }
      : {}),
    ...(record?.narrative?.length
      ? { description: record.narrative[0] }
      : view.about[0]
        ? { description: view.about[0] }
        : {}),
    ...(view.images.length ? { image: view.images.slice(0, 5) } : {}),
    address: {
      "@type": "PostalAddress",
      addressLocality: view.location,
      addressCountry: "IN",
    },
  };

  // Never an Offer with a fabricated/zero price — omit the whole block when
  // the listing itself has no confirmed price, per DEV-05's own guardrail.
  //
  // R19-06 (2026-09-19): `price` used to be view.priceText, i.e. the feed's
  // raw display string ("70 L", "1.5 Cr", "60,000/month"). schema.org allows
  // Text for price, but a formatted string carries no machine-readable
  // amount, mixes the billing period into the value, and in the rental case
  // states a monthly figure where a consumer reads a total. It now emits the
  // parsed numeric from the same priceValue/rentMonthly pair the budget
  // filter already trusts, with the period expressed structurally. An
  // unparsed price means no Offer at all rather than an invented number.
  //
  // `availability` was also hardcoded InStock on every listing. Nothing in
  // the feed asserts availability, and this site does not maintain per-unit
  // inventory, so the claim was unsupported on all 113 offers the recheck
  // sampled. Omitted: availability is an optional property, and leaving out
  // what cannot be evidenced is what Google's structured-data policies ask
  // for.
  if (view.hasPrice && view.priceValueInr != null) {
    listing.offers = {
      "@type": "Offer",
      priceCurrency: "INR",
      price: view.priceValueInr,
      // Who is actually transacting. Without this the Offer reads as
      // unattributed, which is how a republished portal listing looks.
      offeredBy: homzAgent,
      url: pageUrl,
      ...(view.priceIsMonthly
        ? {
            // UnitPriceSpecification is how a recurring amount states its
            // period; without it "60000" on a rental reads as a sale price.
            priceSpecification: {
              "@type": "UnitPriceSpecification",
              priceCurrency: "INR",
              price: view.priceValueInr,
              unitCode: "MON",
              billingIncrement: 1,
            },
          }
        : {}),
    };
  }

  const graph: Record<string, unknown>[] = [
    {
      "@type": "BreadcrumbList",
      // Built from the same trail the page renders visibly (record.breadcrumbs)
      // so the markup never describes a path the visitor cannot see.
      itemListElement: record?.breadcrumbs?.length
        ? record.breadcrumbs.map((c, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: c.name,
            item: c.href ? `${SITE}${c.href === "/" ? "" : c.href}` : pageUrl,
          }))
        : [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE },
            { "@type": "ListItem", position: 2, name: CATEGORY_LABEL[view.category], item: `${SITE}/${routeBase}` },
            { "@type": "ListItem", position: 3, name: view.title, item: pageUrl },
          ],
    },
    listing,
  ];

  // FAQPage dropped (SEO audit 2026-09-25, B9): FAQ rich results have been
  // limited to government and health sites since 2023, and three templated
  // questions repeated across ~34k listings read as manufactured markup.

  const structuredData = { "@context": "https://schema.org", "@graph": graph };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJson(structuredData) }}
    />
  );
}
