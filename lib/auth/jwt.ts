import { SignJWT, jwtVerify } from "jose";
import type { PublicUser } from "./user";

const SESSION_DURATION = "7d";

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_JWT_SECRET;
  if (!secret) {
    throw new Error("AUTH_JWT_SECRET is not set — add it to your .env.local file.");
  }
  return new TextEncoder().encode(secret);
}

export type SessionPayload = PublicUser;

export async function signSessionToken(user: PublicUser): Promise<string> {
  return new SignJWT({ name: user.name, email: user.email, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(SESSION_DURATION)
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (!payload.sub || !payload.email || !payload.role) return null;
    return {
      id: payload.sub,
      name: String(payload.name ?? ""),
      email: String(payload.email),
      role: payload.role as PublicUser["role"],
    };
  } catch {
    return null;
  }
}
