import { cookies } from "next/headers";
import { signSessionToken, verifySessionToken, type SessionPayload } from "./jwt";
import type { PublicUser } from "./user";

export const SESSION_COOKIE = "homz_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days, matches the JWT expiry

export async function createSessionCookie(user: PublicUser): Promise<void> {
  const token = await signSessionToken(user);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

// Server-only — reads and verifies the session cookie. Returns null if there
// is no session or it's invalid/expired. Safe to call from Server Components,
// Route Handlers, and Server Actions.
export async function getSessionUser(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
