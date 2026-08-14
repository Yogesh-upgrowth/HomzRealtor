import type { Collection } from "mongodb";
import { getDb } from "@/lib/mongodb";
import type { WishlistItemDoc } from "./types";

// Same lazy index bootstrap pattern as lib/status/db.ts / lib/auth/user.ts.
let indexesEnsured = false;

export async function getWishlistCollection(): Promise<Collection<WishlistItemDoc>> {
  const db = await getDb();
  const collection = db.collection<WishlistItemDoc>("wishlist_items");

  if (!indexesEnsured) {
    indexesEnsured = true;
    await Promise.all([
      // One save per (user, item) — re-saving the same item is a no-op, not a duplicate.
      collection.createIndex(
        { userId: 1, itemType: 1, citySegment: 1, slug: 1 },
        { unique: true }
      ),
      collection.createIndex({ userId: 1, createdAt: -1 }), // the wishlist page's own list
    ]).catch(() => {
      // Index creation is best-effort — a race with another instance is fine.
    });
  }

  return collection;
}
