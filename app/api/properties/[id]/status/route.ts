import { NextResponse } from "next/server";
import { requireAgent } from "@/lib/properties/access";
import { updatePropertyStatusSchema } from "@/lib/properties/validation";
import { setPropertyStatus } from "@/lib/properties/queries";

export async function PATCH(
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

  const parsed = updatePropertyStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid input" },
      { status: 400 }
    );
  }

  try {
    const doc = await setPropertyStatus(auth.user.id, id, parsed.data.status);
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ status: doc.status });
  } catch (error) {
    console.error("Failed to update property status:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
