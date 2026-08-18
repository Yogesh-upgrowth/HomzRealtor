// Paginated, server-filtered view over a homz-scrape Properties segment
// (ggnSaleProperties, ggnRentProperties, ...). Never touches MongoDB: the
// segment itself still comes from the same daily-refreshed static export
// PropertyListingPage used to fetch in full (see docs/listings-feed-contract.md
// in Homz-Scrape) — this route just adds a cached, filtered, paginated layer
// in front of it so the browser only ever downloads one page of results
// instead of the whole segment.
//
// GET /api/listings?segment=ggnSaleProperties&category=Sale&bedrooms=3&budget=1cr-2cr&page=1&limit=8

import { NextResponse } from "next/server";
import { getSegment } from "@/lib/listings/segmentCache";
import {
  computeFacets,
  filterProperties,
  sortByImageFirst,
  type ListingFilters,
  type PropertyCategory,
} from "@/lib/listings/filters";

// Matches propertySegment()'s own output shape ("ggnSaleProperties", ...) —
// rejects anything else before it's used to build an outbound URL.
const SEGMENT_RE = /^[a-zA-Z]+(Sale|Rent|Pg|Commercial)Properties$/;
const VALID_CATEGORIES: PropertyCategory[] = ["Sale", "Rent", "Pg", "Commercial"];

function parsePositiveInt(value: string | null, fallback: number): number {
  const n = value ? parseInt(value, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const segment = searchParams.get("segment") || "";
  const category = (searchParams.get("category") || "") as PropertyCategory;

  if (!SEGMENT_RE.test(segment) || !VALID_CATEGORIES.includes(category)) {
    return NextResponse.json(
      { success: false, error: "invalid segment or category" },
      { status: 400 }
    );
  }

  const page = parsePositiveInt(searchParams.get("page"), 1);
  const limit = Math.min(parsePositiveInt(searchParams.get("limit"), 8), 100);

  let all;
  try {
    all = await getSegment(segment);
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to load listings" },
      { status: 502 }
    );
  }

  const sorted = sortByImageFirst(all);

  const filters: ListingFilters = {
    q: searchParams.get("q") || "",
    propertyType: searchParams.get("type") || "",
    bedrooms: searchParams.get("bedrooms") || "",
    budget: searchParams.get("budget") || "",
    possession: searchParams.get("possession") || "",
    saleType: searchParams.get("saleType") || "",
    golf: searchParams.get("golf") === "1",
    investmentGrade: searchParams.get("investmentGrade") === "1",
  };

  const filtered = filterProperties(sorted, filters, category);
  const facets = computeFacets(sorted);

  const start = (page - 1) * limit;
  const results = filtered.slice(start, start + limit);

  return NextResponse.json(
    {
      success: true,
      city: segment,
      page,
      limit,
      total: filtered.length,
      results,
      facets,
    },
    { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600" } }
  );
}
