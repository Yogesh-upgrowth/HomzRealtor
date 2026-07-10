import type { NormalizedProject } from "@/lib/intelligence/normalize";
import type { FaqItem } from "@/lib/intelligence/content";
import type { ConnectivityItem } from "@/lib/intelligence/geo";

// FAQPage schema only. BreadcrumbList + RealEstateListing are emitted once, in
// the project page itself (app/project-listing/[city]/[slug]/page.tsx), so no
// schema type is duplicated across the page \u2014 Google penalises duplicate FAQ /
// listing blocks and duplicates dilute the signal.
type Props = {
  project: NormalizedProject;
  faq?: FaqItem[];
  connectivity?: ConnectivityItem[];
  coords?: { lat: number; lng: number } | null;
};

const ProjectJsonLd = ({ faq }: Props) => {
  if (!faq || faq.length === 0) return null;

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const safeJson = (g: unknown) =>
    JSON.stringify(g)
      .replace(/</g, "\\u003c")
      .replace(/>/g, "\\u003e")
      .replace(/&/g, "\\u0026")
      .replace(/\u2028/g, "\\u2028")
      .replace(/\u2029/g, "\\u2029");

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJson(faqLd) }}
    />
  );
};

export default ProjectJsonLd;
