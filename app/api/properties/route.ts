import { NextResponse } from "next/server";
import { requireAgent } from "@/lib/properties/access";
import { createAgentPropertySchema } from "@/lib/properties/validation";
import { createProperty, listPropertiesForOwner } from "@/lib/properties/queries";
import { toPropertyListItem } from "@/lib/properties/serialize";
import type { PropertyStatus } from "@/lib/properties/types";

const VALID_STATUSES: PropertyStatus[] = ["active", "inactive", "archived"];

export async function GET(req: Request) {
  const auth = await requireAgent();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get("status");
  const status =
    statusParam && VALID_STATUSES.includes(statusParam as PropertyStatus)
      ? (statusParam as PropertyStatus)
      : undefined;

  try {
    const docs = await listPropertiesForOwner(auth.user.id, status);
    return NextResponse.json({ properties: docs.map(toPropertyListItem) });
  } catch (error) {
    console.error("Failed to list properties:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireAgent();
  if (!auth.ok) return auth.response;

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
    const doc = await createProperty(auth.user.id, parsed.data);
    return NextResponse.json({ id: doc._id?.toString() }, { status: 201 });
  } catch (error) {
    console.error("Failed to create property:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
