import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireAuth } from "@/lib/auth/guards";
import { updateProfileSchema } from "@/lib/auth/validation";
import { getUsersCollection, toPublicUser } from "@/lib/auth/user";
import { createSessionCookie } from "@/lib/auth/session";

// Shared by the customer's /account page and the agent's core-fields section
// on /dashboard/profile — both edit the same users fields (name/phone/city).
export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  return NextResponse.json({ user: auth.user });
}

export async function PATCH(req: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid input" },
      { status: 400 }
    );
  }

  const { name, phone, city } = parsed.data;

  try {
    const users = await getUsersCollection();

    const phoneConflict = await users.findOne({
      phone,
      _id: { $ne: new ObjectId(auth.user.id) },
    });
    if (phoneConflict) {
      return NextResponse.json(
        { error: "An account with this phone number already exists" },
        { status: 409 }
      );
    }

    const result = await users.findOneAndUpdate(
      { _id: new ObjectId(auth.user.id) },
      { $set: { name, phone, city, updatedAt: new Date() } },
      { returnDocument: "after" }
    );
    if (!result) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const publicUser = toPublicUser(result);
    // The session cookie carries name/phone/city as claims — re-issue it so
    // the change is reflected immediately without requiring a re-login.
    await createSessionCookie(publicUser);

    return NextResponse.json({ user: publicUser });
  } catch (error) {
    console.error("Profile update failed:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
