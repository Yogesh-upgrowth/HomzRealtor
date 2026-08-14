import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import type { SessionPayload } from "@/lib/auth/jwt";

// Shared guards for API routes — the real authorization boundary, since
// page-level layout gates only protect navigation, not direct API calls.

export async function requireAuth(): Promise<
  { ok: true; user: SessionPayload } | { ok: false; response: NextResponse }
> {
  const user = await getSessionUser();
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Not authenticated" }, { status: 401 }),
    };
  }
  return { ok: true, user };
}

export async function requireAgent(): Promise<
  { ok: true; user: SessionPayload } | { ok: false; response: NextResponse }
> {
  const auth = await requireAuth();
  if (!auth.ok) return auth;
  if (auth.user.role !== "agent") {
    return {
      ok: false,
      response: NextResponse.json({ error: "Agents only" }, { status: 403 }),
    };
  }
  return auth;
}

export async function requireCustomer(): Promise<
  { ok: true; user: SessionPayload } | { ok: false; response: NextResponse }
> {
  const auth = await requireAuth();
  if (!auth.ok) return auth;
  if (auth.user.role !== "customer") {
    return {
      ok: false,
      response: NextResponse.json({ error: "Customers only" }, { status: 403 }),
    };
  }
  return auth;
}

// Both admin tiers can review/take down listings.
export async function requireAdmin(): Promise<
  { ok: true; user: SessionPayload } | { ok: false; response: NextResponse }
> {
  const auth = await requireAuth();
  if (!auth.ok) return auth;
  if (auth.user.role !== "admin" && auth.user.role !== "super_admin") {
    return {
      ok: false,
      response: NextResponse.json({ error: "Admins only" }, { status: 403 }),
    };
  }
  return auth;
}

// Only super_admin can grant/revoke admin access — a plain admin cannot mint
// other admins, by design (see lib/auth/user.ts).
export async function requireSuperAdmin(): Promise<
  { ok: true; user: SessionPayload } | { ok: false; response: NextResponse }
> {
  const auth = await requireAuth();
  if (!auth.ok) return auth;
  if (auth.user.role !== "super_admin") {
    return {
      ok: false,
      response: NextResponse.json({ error: "Super admins only" }, { status: 403 }),
    };
  }
  return auth;
}
