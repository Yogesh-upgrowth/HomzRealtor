import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { getUsersCollection } from "@/lib/auth/user";
import { takedownSchema } from "@/lib/properties/validation";
import { getPropertyById, getReviewEventsForProperty, takedownProperty } from "@/lib/properties/queries";
import { toPropertyDetail, toReviewEventView } from "@/lib/properties/serialize";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const { id } = await params;

  try {
    const doc = await getPropertyById(id);
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const events = await getReviewEventsForProperty(id);
    const adminIds = [...new Set(events.map((e) => e.adminId.toString()))].filter((i) =>
      ObjectId.isValid(i)
    );

    const users = await getUsersCollection();
    const [owner, admins] = await Promise.all([
      users.findOne({ _id: doc.ownerId }),
      users.find({ _id: { $in: adminIds.map((i) => new ObjectId(i)) } }).toArray(),
    ]);
    const adminNameById = new Map(admins.map((a) => [a._id!.toString(), a.name]));

    return NextResponse.json({
      property: toPropertyDetail(doc),
      owner: owner
        ? { id: owner._id!.toString(), name: owner.name, email: owner.email, phone: owner.phone }
        : null,
      reviewHistory: events.map((e) =>
        toReviewEventView(e, adminNameById.get(e.adminId.toString()) ?? "Unknown")
      ),
    });
  } catch (error) {
    console.error("Failed to fetch property for admin:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// Takedown of any listing regardless of current status — distinct from the
// agent's own ownership-scoped DELETE on /api/properties/[id], which hard-
// deletes. This soft-archives and logs a "removed" review event instead.
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = takedownSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid input" },
      { status: 400 }
    );
  }

  try {
    const doc = await takedownProperty(id, parsed.data.reason, auth.user.id);
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ status: doc.status });
  } catch (error) {
    console.error("Failed to take down property:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
