import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { getUsersCollection } from "@/lib/auth/user";
import { listPropertiesForAdmin } from "@/lib/properties/queries";
import { toAdminPropertyListItem } from "@/lib/properties/serialize";
import type { PropertyStatus } from "@/lib/properties/types";

const VALID_STATUSES: PropertyStatus[] = ["pending", "active", "inactive", "rejected", "archived"];

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get("status");
  const status =
    statusParam && VALID_STATUSES.includes(statusParam as PropertyStatus)
      ? (statusParam as PropertyStatus)
      : undefined;
  const city = searchParams.get("city")?.trim() || undefined;
  const agentId = searchParams.get("agentId")?.trim() || undefined;

  try {
    const docs = await listPropertiesForAdmin({ status, city, ownerId: agentId });

    const ownerIds = [...new Set(docs.map((d) => d.ownerId.toString()))].filter((id) =>
      ObjectId.isValid(id)
    );
    const users = await getUsersCollection();
    const owners = await users
      .find({ _id: { $in: ownerIds.map((id) => new ObjectId(id)) } })
      .toArray();
    const ownerById = new Map(owners.map((o) => [o._id!.toString(), o]));

    const properties = docs.map((doc) => {
      const owner = ownerById.get(doc.ownerId.toString());
      return toAdminPropertyListItem(doc, {
        name: owner?.name ?? "Unknown",
        email: owner?.email ?? "",
      });
    });

    return NextResponse.json({ properties });
  } catch (error) {
    console.error("Failed to list properties for admin:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
