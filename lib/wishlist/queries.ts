import { ObjectId } from "mongodb";
import { getWishlistCollection } from "./db";
import type { WishlistItemDoc } from "./types";
import type { AddWishlistItemInput, WishlistItemKeyInput } from "./validation";

export async function listWishlistItems(userId: string): Promise<WishlistItemDoc[]> {
  const collection = await getWishlistCollection();
  return collection.find({ userId: new ObjectId(userId) }).sort({ createdAt: -1 }).toArray();
}

// Idempotent — saving an already-saved item just returns the existing doc
// rather than erroring, so the client doesn't need to check first.
export async function addWishlistItem(
  userId: string,
  input: AddWishlistItemInput
): Promise<WishlistItemDoc> {
  const collection = await getWishlistCollection();
  const filter = {
    userId: new ObjectId(userId),
    itemType: input.itemType,
    citySegment: input.citySegment,
    slug: input.slug,
  };

  const result = await collection.findOneAndUpdate(
    filter,
    {
      $setOnInsert: {
        ...filter,
        propertyId: input.propertyId,
        category: input.category,
        title: input.title,
        imageUrl: input.imageUrl,
        priceText: input.priceText,
        locationText: input.locationText,
        createdAt: new Date(),
      },
    },
    { upsert: true, returnDocument: "after" }
  );

  return result as WishlistItemDoc;
}

export async function removeWishlistItem(
  userId: string,
  key: WishlistItemKeyInput
): Promise<boolean> {
  const collection = await getWishlistCollection();
  const result = await collection.deleteOne({
    userId: new ObjectId(userId),
    itemType: key.itemType,
    citySegment: key.citySegment,
    slug: key.slug,
  });
  return result.deletedCount === 1;
}
