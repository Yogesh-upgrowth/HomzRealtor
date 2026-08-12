import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { getUsersCollection } from "@/lib/auth/user";

// Powers the Manage Admins screen's search-by-email box. super_admin only —
// a plain admin has no reason to look up arbitrary users by email.
export async function GET(req: Request) {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim().toLowerCase();
  if (!q || q.length < 2) {
    return NextResponse.json({ users: [] });
  }

  try {
    const users = await getUsersCollection();
    const matches = await users
      .find({ email: { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } })
      .limit(20)
      .toArray();

    return NextResponse.json({
      users: matches.map((u) => ({
        id: u._id!.toString(),
        name: u.name,
        email: u.email,
        role: u.role,
      })),
    });
  } catch (error) {
    console.error("Failed to search users:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
