import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { getUsersCollection } from "@/lib/auth/user";

// Pending admin applications only — never a general customer/agent
// directory. Powers the "Pending Requests" section of Manage Admins.
export async function GET() {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return auth.response;

  try {
    const users = await getUsersCollection();
    const pending = await users
      .find({ adminRequestedAt: { $ne: null } })
      .sort({ adminRequestedAt: -1 })
      .toArray();

    return NextResponse.json({
      requests: pending.map((u) => ({
        id: u._id!.toString(),
        name: u.name,
        email: u.email,
        requestedAt: u.adminRequestedAt!.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Failed to list admin requests:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
