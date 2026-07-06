import type { NormalizedProject } from "@/lib/intelligence/normalize";
import type { FaqItem } from "@/lib/intelligence/content";
import type { ConnectivityItem } from "@/lib/intelligence/geo";

const SITE = "https://www.homzrealtor.com";

const cityLabel: Record<string, string> = {
  ggn: "Gurgaon",
  delhi: "Delhi",
  faridabad: "Faridabad",
  gNoida: "Greater Noida",
  noida: "Noida",
};

// Canonical city slug used in the page route (/project-listing/[city]/[slug]).
// Must match the URL the user actually visits, NOT the internal city_key.
const citySlug: Record<string, string> = {
  ggn: "gurgaon",
  delhi: "delhi",
  faridabad: "faridabad",
  gNoida: "greaternoida",
  noida: "noida",
};

type Props = {
  project: NormalizedProject;
  faq?: FaqItem[];
  connectivity?: ConnectivityItem[];
  coords?: { lat: number; lng: number } | null;
};

const ProjectJsonLd = ({ project, faq, coords }: Props) => {
  const citySeg = citySlug[project.city_key] || project.city_key;
  const url = `${SITE}/project-listing/${citySeg}/${project.slug}`;
  const images = project.images
    .filter((u) => typeof u === "string" && /\.(jpg|jpeg|png|webp)(\?|$)/i.test(u))
    .slice(0, 5);

  const listing: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: project.project_name,
    url,
    description: project.about?.[0] || undefined,
    image: images.length ? images : undefined,
    provider: { "@type": "Organization", name: project.builder },
    address: {
      "@type": "PostalAddress",
      streetAddress: [project.sector, project.micro_market].filter(Boolean).join(", ") || undefined,
      addressLocality: project.city_name,
      addressRegion: project.state,
      addressCountry: "IN",
    },
  };

  if (coords) {
    listing.geo = {
      "@type": "GeoCoordinates",
      latitude: coords.lat,
      longitude: coords.lng,
    };
  }

  if (project.min_price_inr) {
    listing.offers = {
      "@type": "AggregateOffer",
      priceCurrency: "INR",
      lowPrice: project.min_price_inr,
      highPrice: project.max_price_inr ?? undefined,
    };
  }

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE },
      { "@type": "ListItem", position: 2, name: "Projects", item: `${SITE}/project-listing` },
      {
        "@type": "ListItem",
        position: 3,
        name: cityLabel[project.city_key] || project.city_name,
        item: `${SITE}/project-listing`,
      },
      { "@type": "ListItem", position: 4, name: project.project_name, item: url },
    ],
  };

  const faqLd =
    faq && faq.length
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faq.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }
      : null;

  const graphs = [listing, breadcrumb, faqLd].filter(Boolean);

  const safeJson = (g: unknown) =>
    JSON.stringify(g)
      .replace(/</g, "\\u003c")
      .replace(/>/g, "\\u003e")
      .replace(/&/g, "\\u0026")
      .replace(/\u2028/g, "\\u2028")
      .replace(/\u2029/g, "\\u2029");

  return (
    <>
      {graphs.map((g, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJson(g) }}
        />
      ))}
    </>
  );
};

export default ProjectJsonLd;
