import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { getUsersCollection } from "@/lib/auth/user";

const VALID_ACTIONS = ["approve", "reject"];

// Approve grants admin; reject deletes the account entirely (per design —
// a rejected applicant reapplies from scratch rather than lingering in a
// "rejected" state).
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return auth.response;
  const { id } = await params;

  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const action = (body as { action?: string })?.action;
  if (!action || !VALID_ACTIONS.includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  try {
    const users = await getUsersCollection();
    const target = await users.findOne({ _id: new ObjectId(id) });
    if (!target || !target.adminRequestedAt) {
      return NextResponse.json({ error: "No pending request found" }, { status: 404 });
    }

    if (action === "reject") {
      await users.deleteOne({ _id: target._id });
      return NextResponse.json({ id, action: "rejected" });
    }

    await users.updateOne(
      { _id: target._id },
      {
        $set: {
          role: "admin",
          grantedAdminBy: new ObjectId(auth.user.id),
          grantedAdminAt: new Date(),
          adminRequestedAt: null,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({ id, action: "approved" });
  } catch (error) {
    console.error("Failed to decide admin request:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
