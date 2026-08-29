// Factory for the four category detail routes (app/{buy-property,rent-
// property,commercial,pg-property}/[city]/[slug]/page.tsx) — same
// generateMetadata + lookup-or-404 logic for all four, parametrized by
// category so it isn't copy-pasted four times.

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPropertyBySlug } from "@/lib/intelligence/get-property";
import PropertyDetailView from "@/components/PropertyListing/PropertyDetailView";
import type { PropertyCategory } from "@/lib/scraping/homzbackend";

type PageParams = { params: Promise<{ city: string; slug: string }> };

const ROUTE_BASE: Record<PropertyCategory, string> = {
  Sale: "buy-property",
  Rent: "rent-property",
  Pg: "pg-property",
  Commercial: "commercial",
};

export function makePropertyDetailPage(category: PropertyCategory) {
  const routeBase = ROUTE_BASE[category];

  async function generateMetadata({ params }: PageParams): Promise<Metadata> {
    const { city, slug } = await params;
    const view = await getPropertyBySlug(category, city, slug);
    if (!view) return {};
    const description = view.keyHighlights[0] || `${view.title} in ${view.location}.`;
    return {
      title: view.title,
      description,
      alternates: { canonical: `/${routeBase}/${city}/${slug}` },
      openGraph: {
        title: view.title,
        description,
        images: view.heroImage ? [view.heroImage] : undefined,
      },
    };
  }

  async function Page({ params }: PageParams) {
    const { city, slug } = await params;
    const view = await getPropertyBySlug(category, city, slug);
    if (!view) notFound();
    return <PropertyDetailView view={view} />;
  }

  return { generateMetadata, Page };
}
