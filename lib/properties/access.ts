import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import type { SessionPayload } from "@/lib/auth/jwt";

// Shared guard for every /api/properties/** route (and the Blob upload
// route's onBeforeGenerateToken) — the real authorization boundary, since the
// app/dashboard/layout.tsx gate only protects page navigation, not direct API
// calls.
export async function requireAgent(): Promise<
  { ok: true; user: SessionPayload } | { ok: false; response: NextResponse }
> {
  const user = await getSessionUser();
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Not authenticated" }, { status: 401 }),
    };
  }
  if (user.role !== "agent") {
    return {
      ok: false,
      response: NextResponse.json({ error: "Agents only" }, { status: 403 }),
    };
  }
  return { ok: true, user };
}
