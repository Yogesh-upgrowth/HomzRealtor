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
  allowedDevOrigins: [
    "*.replit.dev",
    "*.sisko.replit.dev",
    "*.repl.co",
    "127.0.0.1",
  ],
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
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      `img-src 'self' blob: data: ${IMAGE_HOSTS.map((h) => `https://${h}`).join(" ")}`,
      "font-src 'self'",
      "connect-src 'self'",
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
  async redirects() {
    return [
      // /contact-us 404'd outright; /contact is the one real contact page.
      {
        source: "/contact-us",
        destination: "/contact",
        permanent: true,
      },
      // The project "enquire" page was renamed to "flat" — keep old links working.
      {
        source: "/project-listing/:city/:slug/enquire",
        destination: "/project-listing/:city/:slug/flat",
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
