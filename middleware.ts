import { NextResponse, type NextRequest } from "next/server";
import { getHomepageMarkdown } from "@/lib/seo/homepageMarkdown";
import { developerRedirectTarget, isInvalidDeveloperSlug } from "@/lib/content/developers";

// Canonical host matches every hardcoded URL in metadata/sitemap/robots
// (https://www.homzrealtor.com). This is a code-level safety net for
// https/www hygiene — the primary enforcement should live in the hosting
// provider's domain settings (e.g. Vercel's Domain redirect), which redirects
// at the edge before a request even reaches this middleware. Only matches the
// real production hosts, so localhost and Vercel preview deployments
// (*.vercel.app) are never touched.
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

// Checklist item 4, "Malformed developer pages" (2026-09-21).
//
// The audit found /developer/the and /developer/j indexed, created when the
// builder parser took the first word of a project title as a company name.
// The parser is fixed and those names no longer produce internal links, but
// the URLs are in Google's index and a crawler will keep requesting them.
//
// Three outcomes, and the difference matters for how fast the index clears:
//
//   301  The slug is a known alias of a real developer (/developer/emaar-mgf).
//        A permanent redirect passes the signal to the canonical hub.
//   410  The slug can never be a developer (/developer/the). Gone is stronger
//        than 404: it tells Google the URL is permanently retired rather than
//        possibly-missing, and it drops out of the index faster.
//   next Anything else — the page decides, and an unconfirmed-but-plausible
//        name still renders noindex,follow rather than disappearing.
//
// This sits in middleware rather than the page because a 410 must not render
// the developer template at all, and because notFound() can only produce 404.
const DEVELOPER_PATH = /^\/developer\/([^/]+)\/?$/;

// Served with the 410 so a person who follows an old search result sees an
// explanation and a way onward, not a blank error. Kept inline and tiny: the
// route it replaces must not render, so there is no layout to borrow.
function developerGonePage(): string {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>This developer page no longer exists — HomzRealtor</title>
<style>
 body{margin:0;background:#0b0b0c;color:#e5e7eb;font:16px/1.6 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
 main{max-width:34rem;margin:0 auto;padding:6rem 1.25rem}
 h1{font-size:1.6rem;line-height:1.3;margin:0 0 1rem}
 p{color:#9ca3af;margin:0 0 1rem}
 a{color:#cea44e}
</style></head>
<body><main>
<h1>This developer page no longer exists</h1>
<p>It was created automatically from a project title rather than from a real
developer, so it has been removed for good.</p>
<p><a href="/developer">Browse property developers</a> &middot;
<a href="/project-listing/gurgaon">Gurgaon projects</a> &middot;
<a href="/buy-property/gurgaon">Property for sale in Gurgaon</a></p>
</main></body></html>`;
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

  // Developer slug policy. Runs after the host/case fixes above so the slug
  // examined here is already lowercase and on the canonical host — a
  // mixed-case /developer/The gets its one 308 first, then this 410s the
  // lowercase form, rather than 410ing a URL whose canonical form differs.
  const developerMatch = DEVELOPER_PATH.exec(pathname);
  if (developerMatch) {
    const slug = decodeURIComponent(developerMatch[1]).toLowerCase();

    const target = developerRedirectTarget(slug);
    if (target) {
      const url = request.nextUrl.clone();
      url.pathname = `/developer/${target}`;
      return NextResponse.redirect(url, 301);
    }

    if (isInvalidDeveloperSlug(slug)) {
      return new NextResponse(request.method === "HEAD" ? null : developerGonePage(), {
        status: 410,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "X-Robots-Tag": "noindex",
          // A 410 is a permanent decision, so it is worth caching at the edge;
          // the alternative is re-running middleware for every crawl of a URL
          // whose answer cannot change.
          "Cache-Control": "public, max-age=3600, s-maxage=86400",
        },
      });
    }
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
  // SEO audit 2026-09-25 (B11): only "/" is content-negotiated, so only "/"
  // varies on Accept. Adding it to every response fragmented the CDN cache
  // per Accept header across ~38k URLs for no benefit; Accept-Encoding is
  // dropped too, since the CDN already varies on encoding itself.
  if (request.nextUrl.pathname === "/") {
    addVaryTokens(response.headers, ["Accept"]);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
