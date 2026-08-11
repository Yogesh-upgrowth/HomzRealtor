import { NextResponse, type NextRequest } from "next/server";

// Canonical host matches every hardcoded URL in metadata/sitemap/robots
// (https://www.homzrealtor.com). This is a code-level safety net for
// https/www hygiene — the primary enforcement should live in the hosting
// provider's domain settings (e.g. Vercel's Domain redirect), which redirects
// at the edge before a request even reaches this middleware. Only matches the
// real production hosts, so localhost, Replit dev origins and Vercel preview
// deployments (*.vercel.app) are never touched.
const CANONICAL_HOST = "www.homzrealtor.com";
const APEX_HOST = "homzrealtor.com";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  if (host !== APEX_HOST && host !== CANONICAL_HOST) {
    return NextResponse.next();
  }

  const proto = request.headers.get("x-forwarded-proto") || request.nextUrl.protocol.replace(":", "");
  const needsHostFix = host === APEX_HOST;
  const needsHttpsFix = proto === "http";

  if (needsHostFix || needsHttpsFix) {
    const url = request.nextUrl.clone();
    url.protocol = "https:";
    url.host = CANONICAL_HOST;
    // Single hop covers both the host and protocol change at once, avoiding
    // a redirect chain (http+apex -> https+apex -> https+www).
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
