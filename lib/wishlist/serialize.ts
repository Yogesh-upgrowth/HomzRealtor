import type { WishlistItemDoc, WishlistItemView } from "./types";
import { canonicalCitySlug } from "@/lib/intelligence/projects";

// Mirrors PropertyView's ROUTE_BASE (lib/intelligence/property-view.ts) —
// duplicated rather than imported since that file also pulls in the much
// heavier property-detail view-model machinery this doesn't need.
const PROPERTY_ROUTE_BASE: Record<string, string> = {
  Sale: "buy-property",
  Rent: "rent-property",
  Pg: "pg-property",
  Commercial: "commercial",
};

export function toWishlistItemView(doc: WishlistItemDoc): WishlistItemView {
  const href =
    doc.itemType === "project"
      ? `/project-listing/${canonicalCitySlug(doc.citySegment)}/${doc.slug}`
      : `/${PROPERTY_ROUTE_BASE[doc.category || "Sale"]}/${doc.citySegment}/${doc.slug}`;

  return {
    id: doc._id!.toString(),
    itemType: doc.itemType,
    citySegment: doc.citySegment,
    slug: doc.slug,
    propertyId: doc.propertyId,
    category: doc.category,
    title: doc.title,
    imageUrl: doc.imageUrl,
    priceText: doc.priceText,
    locationText: doc.locationText,
    href,
    createdAt: doc.createdAt.toISOString(),
  };
}
