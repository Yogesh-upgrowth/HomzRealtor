import { z } from "zod";

const nullableString = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .optional()
    .transform((v) => v || null);

// Identifies a saved item — enough to look it up for removal, no display
// fields needed. Shared by the DELETE route and as the base for adding.
export const wishlistItemKeySchema = z.object({
  itemType: z.enum(["project", "property"]),
  citySegment: z.string().trim().min(1),
  slug: z.string().trim().min(1),
});

export const addWishlistItemSchema = wishlistItemKeySchema.extend({
  propertyId: nullableString(200),
  category: z.enum(["Sale", "Rent", "Pg", "Commercial"]).nullable().optional().transform((v) => v ?? null),
  title: z.string().trim().min(1).max(200),
  imageUrl: nullableString(2000),
  priceText: nullableString(100),
  locationText: nullableString(200),
});

export type WishlistItemKeyInput = z.infer<typeof wishlistItemKeySchema>;
export type AddWishlistItemInput = z.infer<typeof addWishlistItemSchema>;
