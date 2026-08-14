import type { ObjectId } from "mongodb";
import type { PropertyCategory } from "@/lib/scraping/homzbackend";

// Customer save/wishlist. Public listing data comes entirely from the
// external feed (not our own Mongo), so items are keyed by the same natural
// keys the listing pages already use — no numeric id exists for Projects.

export type WishlistItemType = "project" | "property";

export type WishlistItemDoc = {
  _id?: ObjectId;
  userId: ObjectId; // -> users._id, always role="customer" at save time (enforced by requireCustomer, not stored)
  itemType: WishlistItemType;
  // "project": the raw feed city_key (e.g. "ggn") — matches lib/status's
  // convention; canonicalCitySlug() converts it to the URL segment at
  // render time (see serialize.ts).
  // "property": the already-canonical citySlug (e.g. "gurgaon") used as-is,
  // since that's the form PropertyView/listing pages already carry.
  citySegment: string;
  slug: string;
  propertyId: string | null; // only for itemType "property" — the stable backend id
  category: PropertyCategory | null; // only for itemType "property"
  // Denormalized display fields so the wishlist page renders without a live
  // refetch against the external API — same reasoning as PropertyStatusDoc.
  title: string;
  imageUrl: string | null;
  priceText: string | null;
  locationText: string | null;
  createdAt: Date;
};

export type WishlistItemView = {
  id: string;
  itemType: WishlistItemType;
  citySegment: string;
  slug: string;
  propertyId: string | null;
  category: PropertyCategory | null;
  title: string;
  imageUrl: string | null;
  priceText: string | null;
  locationText: string | null;
  href: string;
  createdAt: string;
};
