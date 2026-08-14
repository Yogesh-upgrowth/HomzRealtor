import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { getUsersCollection } from "@/lib/auth/user";

// Revoking deletes the account entirely rather than reverting it to
// "customer" — mirrors how rejecting a pending application already works.
// Every admin originates from the /admin apply flow, so there's no prior
// customer/agent identity worth preserving underneath the admin role. Only
// valid when the target is currently exactly "admin" — refuses super_admin
// (that tier never changes here) and refuses anyone who isn't an admin.
export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return auth.response;
  const { id } = await params;

  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const users = await getUsersCollection();
    const target = await users.findOne({ _id: new ObjectId(id) });
    if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (target.role !== "admin") {
      return NextResponse.json({ error: "This user is not currently an admin" }, { status: 400 });
    }

    await users.deleteOne({ _id: target._id });

    return NextResponse.json({ id, deleted: true });
  } catch (error) {
    console.error("Failed to revoke admin:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
