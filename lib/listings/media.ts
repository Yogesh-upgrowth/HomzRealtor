// Listing media ownership (2026-09-19).
//
// Every image on a detail page -- including og:image -- is currently hotlinked
// from static.squareyards.com or img.staticmb.com. Two problems, and the
// second is the expensive one:
//
//   1. It is the most visible way a page reads as republished. The largest
//      element on a property page is someone else's file, served from their
//      domain.
//   2. Those links can be cut at any time. If they are, every image and every
//      social preview on ~35,000 pages breaks at once.
//
// Fixing it wholesale is not a code change: it needs owned or licensed media
// (see OWNER_INPUTS content.ownPhotography / content.builderImagery). What
// this module does is make the migration incremental and safe -- a listing
// serves Homz-hosted media the moment any exists for it, and falls back to the
// source until then, with no per-page code change and no flag day.
//
// Note on `unoptimized`: images currently bypass next/image optimisation
// because the Vercel image quota is exhausted. Self-hosting to Blob does not
// by itself fix that -- see OWNER_INPUTS technical.vercelPlan.

import mediaManifest from "@/data/media/listing-media.json";

/** homzListingId -> Homz-hosted image URLs, newest first. Written by
 *  scripts/migrate-listing-media.mjs; empty until that has run. */
type MediaManifest = Record<string, string[]>;

const manifest = mediaManifest as MediaManifest;

const SOURCE_HOSTS = [
  "static.squareyards.com",
  "img.squareyards.com",
  "www.squareyards.com",
  "img.staticmb.com",
];

export function isHotlinked(url: string | null | undefined): boolean {
  if (!url) return false;
  return SOURCE_HOSTS.some((h) => url.includes(h));
}

/** True once at least one image for this listing is served from Homz. */
export function hasOwnedMedia(listingId: string): boolean {
  return (manifest[listingId]?.length ?? 0) > 0;
}

/**
 * The images to render for a listing, Homz-hosted first.
 *
 * Owned media replaces rather than supplements the source images when it
 * exists: a gallery mixing our photography with a portal's is worse than
 * either alone, and the whole point is that the page stops depending on their
 * CDN. Falls back to the source list untouched when we have nothing yet, so
 * this is safe to ship before any migration has run.
 */
export function resolveListingImages(
  listingId: string,
  sourceImages: string[]
): { images: string[]; owned: boolean } {
  const owned = manifest[listingId];
  if (owned && owned.length > 0) return { images: owned, owned: true };
  return { images: sourceImages, owned: false };
}

/**
 * The image to use for og:image and twitter:image.
 *
 * Prefers owned media most strongly here: a social preview is the one place
 * the image is fetched by a third party (WhatsApp, Slack, X) that may not
 * follow a hotlink at all, and property links get shared on WhatsApp
 * constantly. Falls back to the site's own OG default rather than a hotlink
 * when there is no owned image, because a broken preview is worse than a
 * generic one.
 */
export function resolveSocialImage(
  listingId: string,
  sourceImages: string[],
  fallback: string
): string {
  const owned = manifest[listingId];
  if (owned && owned.length > 0) return owned[0];
  const first = sourceImages[0];
  return first && !isHotlinked(first) ? first : fallback;
}
