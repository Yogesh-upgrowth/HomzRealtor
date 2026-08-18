// Typed client for the local /api/listings route — the paginated,
// server-filtered replacement for fetching a whole Properties segment and
// filtering it in the browser (see app/api/listings/route.ts).

import { fetchJson, type FetchJsonOptions } from "@/lib/scraping/http";
import type { RawHomzProperty } from "@/lib/scraping/homzbackend";
import type { ListingFacets, ListingFilters, PropertyCategory } from "./filters";

export type ListingsPage = {
  success: boolean;
  city: string;
  page: number;
  limit: number;
  total: number;
  results: RawHomzProperty[];
  facets: ListingFacets;
};

export function buildListingsUrl(
  segment: string,
  category: PropertyCategory,
  filters: ListingFilters,
  page: number,
  limit: number
): string {
  const params = new URLSearchParams({
    segment,
    category,
    page: String(page),
    limit: String(limit),
  });
  if (filters.q) params.set("q", filters.q);
  if (filters.propertyType) params.set("type", filters.propertyType);
  if (filters.bedrooms) params.set("bedrooms", filters.bedrooms);
  if (filters.budget) params.set("budget", filters.budget);
  if (filters.possession) params.set("possession", filters.possession);
  if (filters.saleType) params.set("saleType", filters.saleType);
  if (filters.golf) params.set("golf", "1");
  if (filters.investmentGrade) params.set("investmentGrade", "1");
  return `/api/listings?${params.toString()}`;
}

export function fetchListingsPage(
  segment: string,
  category: PropertyCategory,
  filters: ListingFilters,
  page: number,
  limit: number,
  opts: FetchJsonOptions = {}
): Promise<ListingsPage> {
  return fetchJson<ListingsPage>(buildListingsUrl(segment, category, filters, page, limit), opts);
}
