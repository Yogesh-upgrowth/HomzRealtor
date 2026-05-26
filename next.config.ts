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
};

module.exports = nextConfig;
