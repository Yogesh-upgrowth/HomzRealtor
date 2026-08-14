import { NextResponse } from "next/server";
import { requireCustomer } from "@/lib/auth/guards";
import { addWishlistItemSchema, wishlistItemKeySchema } from "@/lib/wishlist/validation";
import { addWishlistItem, listWishlistItems, removeWishlistItem } from "@/lib/wishlist/queries";
import { toWishlistItemView } from "@/lib/wishlist/serialize";

export async function GET() {
  const auth = await requireCustomer();
  if (!auth.ok) return auth.response;

  try {
    const docs = await listWishlistItems(auth.user.id);
    return NextResponse.json({ items: docs.map(toWishlistItemView) });
  } catch (error) {
    console.error("Failed to list wishlist:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireCustomer();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = addWishlistItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid input" },
      { status: 400 }
    );
  }

  try {
    const doc = await addWishlistItem(auth.user.id, parsed.data);
    return NextResponse.json({ item: toWishlistItemView(doc) }, { status: 201 });
  } catch (error) {
    console.error("Failed to add wishlist item:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const auth = await requireCustomer();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = wishlistItemKeySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid input" },
      { status: 400 }
    );
  }

  try {
    const removed = await removeWishlistItem(auth.user.id, parsed.data);
    if (!removed) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Failed to remove wishlist item:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
