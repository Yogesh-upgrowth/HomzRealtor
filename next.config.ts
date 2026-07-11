/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["*.replit.dev", "*.sisko.replit.dev", "*.repl.co"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "static.squareyards.com",
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
    ];
  },
};

module.exports = nextConfig;
