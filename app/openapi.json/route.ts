import { NextResponse } from "next/server";

// Documents ONLY the two endpoints that are genuinely public today:
// GET /api/listings and GET /api/status/{city}/{slug} — both already serve
// unauthenticated requests in production (see their route.ts files). This is
// not a new API surface being opened up; it's documentation for what's
// already reachable. Every other /api/* route requires a session (agent,
// customer, or admin) and is intentionally left out — publishing it here
// would misrepresent it as a public integration point.
const spec = {
  openapi: "3.1.0",
  info: {
    title: "HomzRealtor Public API",
    version: "1.0.0",
    description:
      "Read-only, unauthenticated endpoints for Gurgaon property listings and status tracking. These are the same endpoints homzrealtor.com's own pages call — nothing here requires an account.",
    contact: { email: "hello@homzrealtor.com" },
  },
  servers: [{ url: "https://www.homzrealtor.com" }],
  paths: {
    "/api/listings": {
      get: {
        operationId: "listProperties",
        summary: "Search individual property listings",
        description:
          "Paginated, filterable list of individual resale/rental/PG/commercial property listings for Gurgaon (project-level inventory is served by the /project-listing pages, not this endpoint).",
        parameters: [
          {
            name: "segment",
            in: "query",
            required: true,
            description:
              'Backend feed segment, formed as "{cityKey}{Category}Properties". Only Gurgaon ("ggn") is populated today.',
            schema: {
              type: "string",
              enum: [
                "ggnSaleProperties",
                "ggnRentProperties",
                "ggnPgProperties",
                "ggnCommercialProperties",
              ],
            },
          },
          {
            name: "category",
            in: "query",
            required: true,
            description: "Must match the category encoded in `segment`.",
            schema: { type: "string", enum: ["Sale", "Rent", "Pg", "Commercial"] },
          },
          {
            name: "page",
            in: "query",
            required: false,
            schema: { type: "integer", minimum: 1, default: 1 },
          },
          {
            name: "limit",
            in: "query",
            required: false,
            schema: { type: "integer", minimum: 1, maximum: 100, default: 8 },
          },
          {
            name: "q",
            in: "query",
            required: false,
            description: "Free-text search over title/location.",
            schema: { type: "string" },
          },
          {
            name: "type",
            in: "query",
            required: false,
            description: "Property type filter, e.g. Apartment, Villa, Plot, Office Space, Retail.",
            schema: { type: "string" },
          },
          {
            name: "bedrooms",
            in: "query",
            required: false,
            description: 'BHK filter, e.g. "2" or "4+".',
            schema: { type: "string" },
          },
          {
            name: "budget",
            in: "query",
            required: false,
            description: 'Budget bucket key, e.g. "under-50l", "50l-1cr", "under-25k".',
            schema: { type: "string" },
          },
          {
            name: "possession",
            in: "query",
            required: false,
            schema: { type: "string" },
          },
          {
            name: "saleType",
            in: "query",
            required: false,
            schema: { type: "string" },
          },
          {
            name: "golf",
            in: "query",
            required: false,
            description: 'Set to "1" to filter to Golf Course Road / Extension listings only.',
            schema: { type: "string", enum: ["1"] },
          },
          {
            name: "investmentGrade",
            in: "query",
            required: false,
            schema: { type: "string", enum: ["1"] },
          },
        ],
        responses: {
          "200": {
            description: "Matching listings for the requested page.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["success", "city", "page", "limit", "total", "results", "facets"],
                  properties: {
                    success: { type: "boolean", enum: [true] },
                    city: { type: "string", description: "Echoes the requested `segment`." },
                    page: { type: "integer" },
                    limit: { type: "integer" },
                    total: { type: "integer", description: "Total matching results across all pages." },
                    results: { type: "array", items: { type: "object" } },
                    facets: { type: "object", description: "Available filter counts for the unfiltered segment." },
                  },
                },
              },
            },
          },
          "400": {
            description: "Invalid or missing `segment`/`category`.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", enum: [false] },
                    error: { type: "string" },
                  },
                },
              },
            },
          },
          "502": {
            description: "Upstream feed temporarily unavailable.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", enum: [false] },
                    error: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/status/{city}/{slug}": {
      get: {
        operationId: "getPropertyStatus",
        summary: "Get a tracked property's current status and change history",
        description:
          "Returns the last-known status (listed/price/possession) for one property, plus a timeline of detected changes. Also schedules a background re-check when the cached data is stale.",
        parameters: [
          {
            name: "city",
            in: "path",
            required: true,
            description: 'City URL slug (e.g. "gurgaon") or raw API city key (e.g. "ggn").',
            schema: { type: "string" },
          },
          {
            name: "slug",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "The property is tracked; current status and event history follow.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["tracked", "status", "events"],
                  properties: {
                    tracked: { type: "boolean", enum: [true] },
                    status: {
                      type: "object",
                      properties: {
                        slug: { type: "string" },
                        title: { type: "string" },
                        status: { type: "string" },
                        listed: { type: "boolean" },
                        priceText: { type: "string", nullable: true },
                        possession: { type: "string", nullable: true },
                        lastCheckedAt: { type: "string", format: "date-time" },
                        lastChangedAt: { type: "string", format: "date-time", nullable: true },
                        firstSeenAt: { type: "string", format: "date-time" },
                      },
                    },
                    events: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          at: { type: "string", format: "date-time" },
                          type: { type: "string" },
                          from: { type: "string", nullable: true },
                          to: { type: "string", nullable: true },
                          source: { type: "string" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          "404": {
            description: "This property isn't tracked.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { tracked: { type: "boolean", enum: [false] } },
                },
              },
            },
          },
        },
      },
    },
  },
} as const;

export async function GET() {
  return NextResponse.json(spec, {
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
  });
}
