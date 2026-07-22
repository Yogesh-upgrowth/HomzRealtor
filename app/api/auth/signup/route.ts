import { NextResponse } from "next/server";
import { signupSchema } from "@/lib/auth/validation";
import { getUsersCollection, toPublicUser } from "@/lib/auth/user";
import { hashPassword } from "@/lib/auth/password";
import { createSessionCookie } from "@/lib/auth/session";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid input" },
      { status: 400 }
    );
  }

  const { name, email, password, role } = parsed.data;

  try {
    const users = await getUsersCollection();

    const existing = await users.findOne({ email });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const doc = {
      name,
      email,
      passwordHash,
      role,
      createdAt: new Date(),
    };

    const { insertedId } = await users.insertOne(doc);
    const publicUser = toPublicUser({ ...doc, _id: insertedId });

    await createSessionCookie(publicUser);

    return NextResponse.json({ user: publicUser }, { status: 201 });
  } catch (error) {
    console.error("Signup failed:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
