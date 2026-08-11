import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getSessionUser } from "@/lib/auth/session";

// Token broker for direct-to-Blob client uploads (components/Form/ImageUploader
// uses upload() from @vercel/blob/client, pointed at this route as
// handleUploadUrl) — no file bytes pass through this Next.js server, which
// matters for video uploads that could otherwise hit serverless body/duration
// limits. The agent-only gate still applies here since this route receives
// the session cookie like any other same-origin route handler.
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
          allowedContentTypes: [
            "image/jpeg",
            "image/png",
            "image/webp",
            "video/mp4",
            "video/quicktime",
          ],
          addRandomSuffix: true,
          maximumSizeInBytes: 50 * 1024 * 1024,
        };
      },
      onUploadCompleted: async () => {
        // Intentionally a no-op: this webhook only fires on a publicly
        // reachable deployment, and the client already has the resolved blob
        // URL from upload() — it's carried in local form state until final
        // submit writes it into the Mongo doc, so no server-side write is
        // needed at upload time.
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
