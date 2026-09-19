// Every external host the browser itself is ever allowed to fetch an image
// from directly — either through next/image's remotePatterns below, or via
// a raw <img src> that bypasses it (WishlistList, AvatarUploader,
// ImageUploader, PropertyDetailView's hero image all do). Single source so
// the images config and the img-src CSP directive can't drift apart.
const IMAGE_HOSTS = [
  "static.squareyards.com",
  "img.squareyards.com",
  "www.squareyards.com",
  "img.staticmb.com",
  "loangateway.urbanmoney.com",
  // Agent-uploaded property photos (Vercel Blob public URLs) — store-id
  // subdomain varies per Blob store, hence the wildcard.
  "*.public.blob.vercel-storage.com",
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Stop advertising "X-Powered-By: Next.js" — a free fingerprint for
  // anyone scripting version-specific exploits against the framework.
  poweredByHeader: false,
  allowedDevOrigins: ["127.0.0.1"],
  images: {
    // static.squareyards.com/loangateway.urbanmoney.com were the only hosts
    // Projects images ever used. The Sale/Rent/PG/Commercial listing feed
    // pulls real images from a wider set — confirmed against live data
    // (img.squareyards.com, img.staticmb.com for MagicBricks, and
    // www.squareyards.com, which occasionally carries a real photo alongside
    // site-logo assets under /assets/ — filtered at the source in
    // lib/intelligence/property-view.ts's validImages() instead of blocked
    // here, since blocking the host would also drop any genuine photo on it).
    remotePatterns: IMAGE_HOSTS.map((hostname) => ({
      protocol: "https",
      hostname,
      pathname: "/**",
    })),
  },
  async headers() {
    // Content-Security-Policy ships Report-Only for now, per the standard
    // rollout order (ship it observing before it can ever block a real
    // request) — script-src needs 'unsafe-inline' because every page emits
    // inline JSON-LD <script> tags (BreadcrumbList/CollectionPage/etc.);
    // tightening that to per-request nonces is a separate, bigger change.
    // Once this has run for a while with no unexpected violations in the
    // browser console, promote it to a real `Content-Security-Policy`
    // header (drop "-Report-Only").
    // R19-03 (2026-09-19): script-src/connect-src/img-src did not allow any
    // Google analytics origin, so promoting this header from Report-Only to
    // enforcing — which the comment above plans — would have silently blocked
    // gtag.js from loading and every measurement request from being sent,
    // with no code change to point at. Added now, while the header is still
    // observe-only, so the promotion is a one-line change rather than an
    // outage. Origins match lib/analytics/gtag.ts's loader and GA4's own
    // collect endpoints; no GTM origin is listed because the container was
    // removed from app/layout.tsx in this same pass.
    const ANALYTICS_SCRIPT_ORIGINS = "https://www.googletagmanager.com";
    const ANALYTICS_CONNECT_ORIGINS =
      "https://www.google-analytics.com https://analytics.google.com https://*.analytics.google.com https://*.google-analytics.com";

    const csp = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline' ${ANALYTICS_SCRIPT_ORIGINS}`,
      "style-src 'self' 'unsafe-inline'",
      `img-src 'self' blob: data: https://www.google-analytics.com ${IMAGE_HOSTS.map((h) => `https://${h}`).join(" ")}`,
      "font-src 'self'",
      `connect-src 'self' ${ANALYTICS_CONNECT_ORIGINS}`,
      // Google Maps embed on /contact, once COMPANY_INFO.mapEmbedUrl is set.
      "frame-src 'self' https://www.google.com",
      "frame-ancestors 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join("; ");

    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          { key: "Content-Security-Policy-Report-Only", value: csp },
        ],
      },
    ];
  },
  async rewrites() {
    // /sitemap.xml must serve a real <sitemapindex> listing the 7 child
    // sitemaps (Google Search Console expects it at this exact conventional
    // URL). It can't be a literal app/sitemap.xml/route.ts file though —
    // Next.js/Turbopack reserves that exact filename for its own metadata-
    // route convention (app/sitemap.ts's generateSitemaps() already claims
    // it internally), and a second file there fails Vercel's production
    // build with "Conflicting route and metadata at /sitemap.xml" (hit
    // twice in this repo's history; a plain `next build --webpack` run
    // doesn't catch it, only Turbopack/Vercel's build does). Routing the
    // public URL to a differently-named, unreserved route at the rewrite
    // layer sidesteps the conflict entirely: Next's build-time file scanner
    // never sees two things claiming "/sitemap.xml".
    return {
      beforeFiles: [
        {
          source: "/sitemap.xml",
          destination: "/sitemap-index.xml",
        },
      ],
    };
  },
  async redirects() {
    return [
      // R19-07 (2026-09-19): every paginated route hard-404s page 1
      // (`if (pageNum === 1) notFound()`), deliberately, so that /page/1 can
      // never become a self-canonical duplicate of the base hub. That call is
      // right and stays. But a 404 is the wrong response for a URL that has a
      // perfectly good canonical equivalent: the recheck reached
      // /project-listing/gurgaon/page/1 and /buy-property/gurgaon/3-bhk/page/1
      // and got dead ends. A 308 to the base path keeps the canonical story
      // intact while letting any stray external link, bookmark or hand-typed
      // guess resolve. Listed before the route files are consulted, so the
      // notFound() branch is simply never reached for page 1.
      { source: "/buy-property/page/1", destination: "/buy-property", permanent: true },
      { source: "/rent-property/page/1", destination: "/rent-property", permanent: true },
      { source: "/commercial/page/1", destination: "/commercial", permanent: true },
      { source: "/buy-property/:city/:slug/page/1", destination: "/buy-property/:city/:slug", permanent: true },
      { source: "/project-listing/:city/page/1", destination: "/project-listing/:city", permanent: true },

      // Audit item 11 (2026-09-19): /plots-and-lands was a noindex "Coming
      // Soon" placeholder linked from the homepage and the blog, while
      // /buy-property/gurgaon/plots is a real, server-rendered facet over the
      // plots Homz actually brokers (propertyType "plot" in the sale feed --
      // see BUY_FACETS and lib/search/searchModes.ts). Sending the friendly
      // URL to the page that has the inventory is strictly better than a
      // dead end, and retires the placeholder without losing the link.
      {
        source: "/plots-and-lands",
        destination: "/buy-property/gurgaon/plots",
        permanent: true,
      },
      // /contact-us 404'd outright; /contact is the one real contact page.
      {
        source: "/contact-us",
        destination: "/contact",
        permanent: true,
      },
      // /developers (plural) used to redirect to /api-docs — a leftover from
      // when /developers itself WAS the API docs page, before that content
      // moved to /api-docs. SEO audit M-01 (2026-09-08): the plural is the
      // far more natural guess for the developer *directory* (/developer,
      // singular, 254 real-estate builders) than for API documentation, and
      // an obvious backlink target — anyone linking "HomzRealtor developers"
      // means the directory, not third-party API docs. Old bookmarks to the
      // API docs under this path are the minority case and still land
      // somewhere real (the developer directory), not a 404.
      {
        source: "/developers",
        destination: "/developer",
        permanent: true,
      },
      // The project "enquire" page was renamed to "flat" — keep old links working.
      {
        source: "/project-listing/:city/:slug/enquire",
        destination: "/project-listing/:city/:slug/flat",
        permanent: true,
      },
      // Content audit B-02 (2026-09-08) — moved to an evergreen slug (no
      // year) since this post is meant to survive a quarterly refresh
      // without a new URL each time.
      {
        source: "/blog/gurgaon-property-price-trends-2026",
        destination: "/blog/gurgaon-property-price-trends",
        permanent: true,
      },
      // Project routes accept both the raw API city key (e.g. "ggn") and the
      // canonical slug (e.g. "gurgaon") — both render the same content, which
      // is a duplicate-content problem. Every internal link now points at the
      // canonical slug only; these redirects catch stale external
      // backlinks/bookmarks still using the short code, matching the
      // <link rel="canonical"> already declared on these pages.
      {
        source: "/project-listing/ggn",
        destination: "/project-listing/gurgaon",
        permanent: true,
      },
      {
        source: "/project-listing/ggn/:path*",
        destination: "/project-listing/gurgaon/:path*",
        permanent: true,
      },
      {
        source: "/project-listing/compare/ggn/:path*",
        destination: "/project-listing/compare/gurgaon/:path*",
        permanent: true,
      },
      {
        source: "/project-listing/gnoida/:path*",
        destination: "/project-listing/greaternoida/:path*",
        permanent: true,
      },
      {
        source: "/project-listing/compare/gnoida/:path*",
        destination: "/project-listing/compare/greaternoida/:path*",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
