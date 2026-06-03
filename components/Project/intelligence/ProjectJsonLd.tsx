import type {
  ProjectRow,
  FaqItem,
  Connectivity,
} from "@/lib/projects/queries";

const SITE = "https://www.homzrealtor.com";

const cityLabel: Record<string, string> = {
  ggn: "Gurgaon",
  delhi: "Delhi",
  faridabad: "Faridabad",
  gNoida: "Greater Noida",
  noida: "Noida",
};

type Props = {
  project: ProjectRow;
  faq?: FaqItem[];
  connectivity?: Connectivity[];
};

const ProjectJsonLd = ({ project, faq }: Props) => {
  const url = `${SITE}/project-listing/${project.city_key}/${project.slug}`;
  const image = (project.images || []).slice(0, 5);

  const listing: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: project.project_name,
    url,
    description: project.about?.[0] || undefined,
    image: image.length ? image : undefined,
  };

  if (project.builder) {
    listing.provider = { "@type": "Organization", name: project.builder };
  }

  const address: Record<string, any> = { "@type": "PostalAddress" };
  if (project.sector || project.micro_market)
    address.streetAddress = [project.sector, project.micro_market]
      .filter(Boolean)
      .join(", ");
  if (project.city_name) address.addressLocality = project.city_name;
  if (project.state) address.addressRegion = project.state;
  address.addressCountry = "IN";
  listing.address = address;

  if (project.latitude != null && project.longitude != null) {
    listing.geo = {
      "@type": "GeoCoordinates",
      latitude: project.latitude,
      longitude: project.longitude,
    };
  }

  if (project.min_price_inr) {
    listing.offers = {
      "@type": "AggregateOffer",
      priceCurrency: "INR",
      lowPrice: Number(project.min_price_inr),
      highPrice: project.max_price_inr
        ? Number(project.max_price_inr)
        : undefined,
    };
  }

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE },
      {
        "@type": "ListItem",
        position: 2,
        name: "Projects",
        item: `${SITE}/project-listing`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: cityLabel[project.city_key] || project.city_key,
        item: `${SITE}/project-listing`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: project.project_name,
        item: url,
      },
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

  return (
    <>
      {graphs.map((g, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(g) }}
        />
      ))}
    </>
  );
};

export default ProjectJsonLd;
