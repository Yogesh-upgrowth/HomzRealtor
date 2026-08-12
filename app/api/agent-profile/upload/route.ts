import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getSessionUser } from "@/lib/auth/session";

// Token broker for the agent profile photo upload (components/Form/AvatarUploader
// points its upload() call here). Kept separate from
// app/api/properties/upload/route.ts — that one is scoped to property
// listing media (images + video, larger size cap); this one only ever
// handles a single small avatar image.
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        const user = await getSessionUser();
        if (!user) throw new Error("Not authenticated");
        if (user.role !== "agent") throw new Error("Agents only");

        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp"],
          addRandomSuffix: true,
          maximumSizeInBytes: 5 * 1024 * 1024,
        };
      },
      onUploadCompleted: async () => {
        // No-op: the client already has the resolved blob URL from upload(),
        // and it's written into the users' agent_profiles doc on the
        // subsequent PATCH /api/agent-profile call, not here.
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Upload failed" },
      { status: 400 }
    );
  }
}
