import { NextResponse } from "next/server";
import { requireAgent } from "@/lib/auth/guards";
import { updateAgentProfileSchema } from "@/lib/agentProfile/validation";
import { getAgentProfile, upsertAgentProfile } from "@/lib/agentProfile/queries";
import { toAgentProfileView } from "@/lib/agentProfile/serialize";

export async function GET() {
  const auth = await requireAgent();
  if (!auth.ok) return auth.response;

  try {
    const doc = await getAgentProfile(auth.user.id);
    return NextResponse.json({ profile: doc ? toAgentProfileView(doc) : null });
  } catch (error) {
    console.error("Failed to fetch agent profile:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const auth = await requireAgent();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = updateAgentProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid input" },
      { status: 400 }
    );
  }

  try {
    const doc = await upsertAgentProfile(auth.user.id, parsed.data);
    return NextResponse.json({ profile: toAgentProfileView(doc) });
  } catch (error) {
    console.error("Failed to save agent profile:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
