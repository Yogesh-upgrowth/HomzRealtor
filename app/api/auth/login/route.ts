import { NextResponse } from "next/server";
import { loginSchema } from "@/lib/auth/validation";
import { getUsersCollection, toPublicUser } from "@/lib/auth/user";
import { verifyPassword } from "@/lib/auth/password";
import { createSessionCookie } from "@/lib/auth/session";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid input" },
      { status: 400 }
    );
  }

  const { email, password } = parsed.data;

  try {
    const users = await getUsersCollection();
    const user = await users.findOne({ email });

    const passwordMatches = user ? await verifyPassword(password, user.passwordHash) : false;
    if (!user || !passwordMatches) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const publicUser = toPublicUser(user);
    await createSessionCookie(publicUser);

    return NextResponse.json({ user: publicUser });
  } catch (error) {
    console.error("Login failed:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
