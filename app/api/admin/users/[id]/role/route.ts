import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { updateUserRoleSchema } from "@/lib/auth/validation";
import { getUsersCollection } from "@/lib/auth/user";

// Grants or revokes the plain "admin" role. super_admin only, and this route
// refuses to touch any target already at "super_admin" — that tier can only
// ever change via scripts/set-user-role.mjs, never through the app, so a
// super_admin can never demote the other one (or themself) through here,
// and the UI can never mint a third.
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

  const parsed = updateUserRoleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid input" },
      { status: 400 }
    );
  }

  try {
    const users = await getUsersCollection();
    const target = await users.findOne({ _id: new ObjectId(id) });
    if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (target.role === "super_admin") {
      return NextResponse.json(
        { error: "super_admin can only be changed via the bootstrap script" },
        { status: 403 }
      );
    }

    const newRole = parsed.data.role;
    const isGrantingAdmin = newRole === "admin";

    await users.updateOne(
      { _id: target._id },
      {
        $set: {
          role: newRole,
          grantedAdminBy: isGrantingAdmin ? new ObjectId(auth.user.id) : null,
          grantedAdminAt: isGrantingAdmin ? new Date() : null,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({ id: target._id.toString(), role: newRole });
  } catch (error) {
    console.error("Failed to update user role:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
