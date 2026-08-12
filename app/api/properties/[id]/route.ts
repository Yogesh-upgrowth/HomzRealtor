import { NextResponse } from "next/server";
import { requireAgent } from "@/lib/auth/guards";
import { createAgentPropertySchema } from "@/lib/properties/validation";
import { getPropertyForOwner, updateProperty, deleteProperty } from "@/lib/properties/queries";
import { toPropertyDetail } from "@/lib/properties/serialize";

// Ownership mismatches return 404 (not 403) throughout — an agent probing
// another agent's id shouldn't be able to tell "doesn't exist" apart from
// "exists but isn't yours".

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAgent();
  if (!auth.ok) return auth.response;
  const { id } = await params;

  try {
    const doc = await getPropertyForOwner(auth.user.id, id);
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ property: toPropertyDetail(doc) });
  } catch (error) {
    console.error("Failed to fetch property:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAgent();
  if (!auth.ok) return auth.response;
  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = createAgentPropertySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid input" },
      { status: 400 }
    );
  }

  try {
    const doc = await updateProperty(auth.user.id, id, parsed.data);
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ id: doc._id?.toString() });
  } catch (error) {
    console.error("Failed to update property:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAgent();
  if (!auth.ok) return auth.response;
  const { id } = await params;

  try {
    const deleted = await deleteProperty(auth.user.id, id);
    if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Failed to delete property:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
