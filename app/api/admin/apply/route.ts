import { NextResponse } from "next/server";
import { applyForAdminSchema } from "@/lib/auth/validation";
import { getUsersCollection } from "@/lib/auth/user";
import { hashPassword } from "@/lib/auth/password";

// Public — no auth guard. This is the only way a non-existing person can
// become admin-eligible: sign up here, then a super_admin approves the
// request from Manage Admins. No session is created on success; the
// applicant isn't admin yet and has nothing to log into.
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = applyForAdminSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid input" },
      { status: 400 }
    );
  }

  const { name, email, phone, city, password } = parsed.data;

  try {
    const users = await getUsersCollection();

    const existing = await users.findOne({ $or: [{ email }, { phone }] });
    if (existing) {
      const conflictField = existing.email === email ? "email" : "phone number";
      return NextResponse.json(
        { error: `An account with this ${conflictField} already exists` },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const now = new Date();
    await users.insertOne({
      name,
      email,
      phone,
      city,
      passwordHash,
      role: "customer",
      grantedAdminBy: null,
      grantedAdminAt: null,
      adminRequestedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Admin application failed:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
