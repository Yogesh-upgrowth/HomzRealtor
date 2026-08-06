/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["*.replit.dev", "*.sisko.replit.dev", "*.repl.co"],
  images: {
    // static.squareyards.com/loangateway.urbanmoney.com were the only hosts
    // Projects images ever used. The Sale/Rent/PG/Commercial listing feed
    // pulls real images from a wider set — confirmed against live data
    // (img.squareyards.com, img.staticmb.com for MagicBricks, and
    // www.squareyards.com, which occasionally carries a real photo alongside
    // site-logo assets under /assets/ — filtered at the source in
    // lib/intelligence/property-view.ts's validImages() instead of blocked
    // here, since blocking the host would also drop any genuine photo on it).
    remotePatterns: [
      {
        protocol: "https",
        hostname: "static.squareyards.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "img.squareyards.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.squareyards.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "img.staticmb.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "loangateway.urbanmoney.com",
        pathname: "/**",
      },
    ],
  },
  async redirects() {
    return [
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
