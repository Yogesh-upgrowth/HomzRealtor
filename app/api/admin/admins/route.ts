import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { getUsersCollection } from "@/lib/auth/user";

// Current plain admins only — never super_admin, never arbitrary
// customer/agent accounts. Powers the "Current Admins" section of Manage
// Admins, where each entry can be revoked back to "customer".
export async function GET() {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return auth.response;

  try {
    const users = await getUsersCollection();
    const admins = await users.find({ role: "admin" }).sort({ grantedAdminAt: -1 }).toArray();

    return NextResponse.json({
      admins: admins.map((u) => ({
        id: u._id!.toString(),
        name: u.name,
        email: u.email,
        grantedAt: u.grantedAdminAt ? u.grantedAdminAt.toISOString() : null,
      })),
    });
  } catch (error) {
    console.error("Failed to list admins:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
