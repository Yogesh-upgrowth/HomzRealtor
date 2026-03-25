/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
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