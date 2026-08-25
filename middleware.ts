import { NextResponse, type NextRequest } from "next/server";
import { getHomepageMarkdown } from "@/lib/seo/homepageMarkdown";

// Canonical host matches every hardcoded URL in metadata/sitemap/robots
// (https://www.homzrealtor.com). This is a code-level safety net for
// https/www hygiene — the primary enforcement should live in the hosting
// provider's domain settings (e.g. Vercel's Domain redirect), which redirects
// at the edge before a request even reaches this middleware. Only matches the
// real production hosts, so localhost, Replit dev origins and Vercel preview
// deployments (*.vercel.app) are never touched.
const CANONICAL_HOST = "www.homzrealtor.com";
const APEX_HOST = "homzrealtor.com";

// Every canonical URL this app generates is already all-lowercase
// (slugify() lowercases, city/sector/builder lookups lowercase their param
// before matching) — but several of those lookups also *accept* a
// mixed-case request and quietly 200 it without ever redirecting to the
// canonical lowercase URL (e.g. /project-listing/Gurgaon), while other
// segments (static pages, project slugs) are case-sensitive and 404. That
// inconsistency, not either behavior alone, is the bug: redirect any
// mixed-case path to its lowercase form here, once, so nothing downstream
// has to special-case it. Static assets and API routes are left alone —
// their case can be meaningful (a hashed /_next/ chunk, an uploaded file
// name, an API param).
const CASE_FIX_EXCLUDED_PREFIXES = ["/_next/", "/api/"];
const HAS_FILE_EXTENSION = /\.[a-zA-Z0-9]+$/;

function needsLowercase(pathname: string): boolean {
  if (CASE_FIX_EXCLUDED_PREFIXES.some((p) => pathname.startsWith(p))) return false;
  if (HAS_FILE_EXTENSION.test(pathname)) return false;
  return pathname !== pathname.toLowerCase();
}

// https://acceptmarkdown.com content-negotiation check. A plain browser's
// Accept header (text/html,application/xhtml+xml,...) never contains
// "text/markdown", so ordinary page loads are completely unaffected — this
// only matches a client that explicitly asked for markdown at parity with
// (or above) html.
function prefersMarkdownOverHtml(accept: string | null): boolean {
  if (!accept) return false;
  const entries = accept.split(",").map((part) => {
    const [type, ...params] = part.trim().split(";");
    const q = params
      .map((p) => p.trim())
      .find((p) => p.startsWith("q="));
    return { type: type.trim().toLowerCase(), q: q ? parseFloat(q.slice(2)) : 1 };
  });
  const markdown = entries.find((e) => e.type === "text/markdown");
  if (!markdown) return false;
  const html = entries.find((e) => e.type === "text/html" || e.type === "*/*");
  return !html || markdown.q >= html.q;
}

// Merge into whatever Vary value Next's own rendering layer may add later
// (it adds RSC-internal tokens like "next-router-state-tree") rather than
// overwrite it — both this middleware and Next's downstream header-setting
// use header.append/merge semantics, so tokens from both survive.
function addVaryTokens(headers: Headers, tokens: string[]) {
  const existing = new Set(
    (headers.get("vary") || "")
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean)
  );
  for (const t of tokens) existing.add(t);
  headers.set("vary", Array.from(existing).join(", "));
}

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const isProductionHost = host === APEX_HOST || host === CANONICAL_HOST;
  const { pathname } = request.nextUrl;
  const needsCaseFix = needsLowercase(pathname);

  if (isProductionHost) {
    const proto = request.headers.get("x-forwarded-proto") || request.nextUrl.protocol.replace(":", "");
    const needsHostFix = host === APEX_HOST;
    const needsHttpsFix = proto === "http";

    if (needsHostFix || needsHttpsFix || needsCaseFix) {
      const url = request.nextUrl.clone();
      url.protocol = "https:";
      url.host = CANONICAL_HOST;
      if (needsCaseFix) url.pathname = pathname.toLowerCase();
      // Single hop covers the host, protocol and case change at once,
      // avoiding a redirect chain (http+apex -> https+apex -> https+www,
      // or a separate extra hop just to fix casing).
      return NextResponse.redirect(url, 308);
    }
  } else if (needsCaseFix) {
    // Preview/dev hosts don't get the host/protocol fix (deliberately —
    // see CANONICAL_HOST's comment), but still get the case fix so a
    // mixed-case URL never quietly duplicates content there either.
    const url = request.nextUrl.clone();
    url.pathname = pathname.toLowerCase();
    return NextResponse.redirect(url, 308);
  }

  // Markdown variant of the homepage — the one page this negotiates today.
  // Extending to more routes means adding another getXMarkdown() source,
  // not more middleware plumbing.
  if (
    request.nextUrl.pathname === "/" &&
    request.method === "GET" &&
    prefersMarkdownOverHtml(request.headers.get("accept"))
  ) {
    const headers = new Headers({
      "Content-Type": "text/markdown; charset=utf-8",
    });
    addVaryTokens(headers, ["Accept", "Accept-Encoding"]);
    return new NextResponse(getHomepageMarkdown(), { status: 200, headers });
  }

  const response = NextResponse.next();
  addVaryTokens(response.headers, ["Accept", "Accept-Encoding"]);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
