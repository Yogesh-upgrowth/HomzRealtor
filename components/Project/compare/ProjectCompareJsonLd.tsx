// BreadcrumbList + ItemList schema only. RealEstateListing/FAQPage for each
// project already live on their own canonical detail pages (see
// components/Project/intelligence/ProjectJsonLd.tsx) — not duplicated here.
type Props = {
  cityName: string;
  citySlug: string;
  nameA: string;
  nameB: string;
  urlA: string;
  urlB: string;
  pageUrl: string;
};

const ProjectCompareJsonLd = ({ cityName, citySlug, nameA, nameB, urlA, urlB, pageUrl }: Props) => {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://www.homzrealtor.com" },
          {
            "@type": "ListItem",
            position: 2,
            name: "Projects",
            item: "https://www.homzrealtor.com/project-listing",
          },
          {
            "@type": "ListItem",
            position: 3,
            name: cityName,
            item: `https://www.homzrealtor.com/project-listing/${citySlug}`,
          },
          {
            "@type": "ListItem",
            position: 4,
            name: `Compare: ${nameA} vs ${nameB}`,
            item: pageUrl,
          },
        ],
      },
      {
        "@type": "ItemList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: nameA, url: urlA },
          { "@type": "ListItem", position: 2, name: nameB, url: urlB },
        ],
      },
    ],
  };

  const safeJson = (g: unknown) => JSON.stringify(g).replace(/</g, "\\u003c");

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJson(structuredData) }}
    />
  );
};

export default ProjectCompareJsonLd;
