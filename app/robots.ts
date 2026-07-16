import type { MetadataRoute } from "next";

// Robots directives. Points crawlers at the XML sitemap and keeps the API and
// Next internals out of the index. Served at /robots.txt.
export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://www.homzrealtor.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
