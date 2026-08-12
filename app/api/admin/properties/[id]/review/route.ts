import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { reviewActionSchema } from "@/lib/properties/validation";
import { getPropertyById, reviewProperty } from "@/lib/properties/queries";

// Only valid from "pending" — approving/rejecting an already-decided listing
// is not allowed through this path (resubmission after rejection goes
// through the agent's own PUT /api/properties/[id], which puts it back to
// "pending" first).
export async function PATCH(
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

  const parsed = reviewActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid input" },
      { status: 400 }
    );
  }

  try {
    const existing = await getPropertyById(id);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (existing.status !== "pending") {
      return NextResponse.json(
        { error: "Only pending listings can be reviewed" },
        { status: 409 }
      );
    }

    const doc = await reviewProperty(id, parsed.data, auth.user.id);
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ status: doc.status });
  } catch (error) {
    console.error("Failed to review property:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
