/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['loangateway.urbanmoney.com'],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "static.squareyards.com",
        pathname: "/**",
      },
    ],
  },
};

module.exports = nextConfig;