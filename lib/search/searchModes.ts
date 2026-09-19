// Single source of truth for "what can you actually search for, per category".
//
// The hero panel (components/Home/QuickSearchPanel.tsx) used to render the
// exact same four inputs — Location, Property Type, Budget, BHK — for every
// tab, so picking "Commercial" still asked for a BHK count (commercial
// inventory has no bedrooms at all) and offered Apartment/Villa as property
// types, while "Plots" asked for a BHK and a property type it then threw
// away. Every listing surface on the site now derives its field set, its
// option lists and its validation from the modes below, so a category's
// filters can never drift apart between the homepage and its listing page.
//
// Option *values* here are the same keys the server-side filter understands
// (lib/listings/filters.ts) and the same query params the listing pages read
// (components/PropertyListing/PropertyListingPage.tsx: q / type / budget /
// bedrooms / possession) — a label is never passed through as a value.

import type { PropertyCategory } from "@/lib/listings/filters";

export type SearchFieldId = "propertyType" | "budget" | "bedrooms" | "possession";

export type SearchOption = { label: string; value: string };

export type SearchValues = {
  q: string;
  type: string;
  budget: string;
  bedrooms: string;
  possession: string;
};

export type SearchMode = {
  id: string;
  /** Tab label. */
  label: string;
  /** Listing route this mode searches. */
  route: string;
  /** Listing category the route renders — used to pick the right budget scale. */
  category: PropertyCategory;
  /** One line under the tabs saying, in plain words, what this tab searches. */
  blurb: string;
  /** Plain-language noun for this mode's inventory, used in the submit
   *  button and in validation messages ("Search homes for sale"). */
  searchNoun: string;
  locationPlaceholder: string;
  locationLabel: string;
  /** Which selects render, in order. Fields absent here are never sent. */
  fields: SearchFieldId[];
  /** Query params always applied for this mode (e.g. Plots => type=plot). */
  fixedParams?: Record<string, string>;
};

export const EMPTY_SEARCH_VALUES: SearchValues = {
  q: "",
  type: "",
  budget: "",
  bedrooms: "",
  possession: "",
};

// Property-type option lists, split by what each category's feed actually
// contains — keys are RawHomzProperty.propertyType values, see
// PROPERTY_TYPE_LABELS in lib/listings/filters.ts.
const RESIDENTIAL_TYPES: SearchOption[] = [
  { label: "Any property type", value: "" },
  { label: "Apartment", value: "apartment" },
  { label: "Builder Floor", value: "builder_floor" },
  { label: "Independent House", value: "independent_house" },
  { label: "Villa", value: "villa" },
  { label: "Penthouse", value: "penthouse" },
  { label: "Studio", value: "studio" },
];

const RENTAL_TYPES: SearchOption[] = [
  { label: "Any property type", value: "" },
  { label: "Apartment", value: "apartment" },
  { label: "Builder Floor", value: "builder_floor" },
  { label: "Independent House", value: "independent_house" },
  { label: "Villa", value: "villa" },
  { label: "Studio", value: "studio" },
  { label: "Serviced Apartment", value: "serviced_apartment" },
];

const COMMERCIAL_TYPES: SearchOption[] = [
  { label: "Any commercial type", value: "" },
  { label: "Office", value: "office" },
  { label: "Retail Shop", value: "retail_shop" },
  { label: "Showroom", value: "showroom" },
  { label: "Warehouse", value: "warehouse" },
  { label: "Co-working Space", value: "co_working" },
];

// Sale/Commercial listings are priced in crores (priceValue); Rent listings
// in monthly rupees (rentMonthly). Keys must match BUDGET_RANGES_SALE /
// BUDGET_RANGES_RENT in lib/listings/filters.ts — a crore-scale key sent to a
// rent search matches nothing at all.
export const SALE_BUDGETS: SearchOption[] = [
  { label: "Any budget", value: "" },
  { label: "Under ₹50 Lakh", value: "under-50l" },
  { label: "₹50L – ₹1 Cr", value: "50l-1cr" },
  { label: "₹1 Cr – ₹2 Cr", value: "1cr-2cr" },
  { label: "Above ₹2 Cr", value: "above-2cr" },
];

export const RENT_BUDGETS: SearchOption[] = [
  { label: "Any budget", value: "" },
  { label: "Under ₹25k/mo", value: "under-25k" },
  { label: "₹25k – ₹50k/mo", value: "25k-50k" },
  { label: "₹50k – ₹1L/mo", value: "50k-1l" },
  { label: "₹1L – ₹3L/mo", value: "1l-3l" },
  { label: "Above ₹3L/mo", value: "above-3l" },
];

export const BEDROOM_OPTIONS: SearchOption[] = [
  { label: "Any BHK", value: "" },
  { label: "1 BHK", value: "1" },
  { label: "2 BHK", value: "2" },
  { label: "3 BHK", value: "3" },
  // filterProperties() reads the "+" as "4 or more".
  { label: "4+ BHK", value: "4+" },
];

export const POSSESSION_OPTIONS: SearchOption[] = [
  { label: "Any possession", value: "" },
  { label: "Ready to Move", value: "ready-to-move" },
  { label: "Under Construction", value: "under-construction" },
  { label: "New Launch", value: "new-launch" },
];

export const SEARCH_MODES: SearchMode[] = [
  {
    id: "buy",
    label: "Buy",
    route: "/buy-property",
    category: "Sale",
    blurb: "Apartments, floors, villas and houses for sale across Gurgaon.",
    searchNoun: "homes for sale",
    locationLabel: "Location or sector",
    locationPlaceholder: "e.g. Sector 65, Golf Course Road",
    fields: ["propertyType", "budget", "bedrooms"],
  },
  {
    id: "rent",
    label: "Rent",
    route: "/rent-property",
    category: "Rent",
    blurb: "Homes available on rent, priced per month.",
    searchNoun: "homes for rent",
    locationLabel: "Location or sector",
    locationPlaceholder: "e.g. Sector 56, DLF Phase 4",
    fields: ["propertyType", "budget", "bedrooms"],
  },
  {
    id: "commercial",
    label: "Commercial",
    route: "/commercial",
    category: "Commercial",
    // Commercial deliberately swaps the BHK field for possession status:
    // offices, shops and warehouses have no bedroom count to filter on.
    blurb: "Offices, shops, showrooms and warehouses — no BHK, filter by possession instead.",
    searchNoun: "commercial spaces",
    locationLabel: "Location or business district",
    locationPlaceholder: "e.g. Cyber City, Sohna Road",
    fields: ["propertyType", "budget", "possession"],
  },
  {
    id: "plots",
    label: "Plots",
    // Plots are part of the sale feed (propertyType "plot"), not a separate
    // one — /plots-and-lands is still a placeholder with no inventory, so a
    // Plots search used to navigate to a "coming soon" page and drop every
    // filter the user had just set.
    route: "/buy-property",
    category: "Sale",
    blurb: "Residential and investment plots for sale — filter by budget and possession.",
    searchNoun: "plots",
    locationLabel: "Location or sector",
    locationPlaceholder: "e.g. Sector 95, New Gurgaon",
    fields: ["budget", "possession"],
    fixedParams: { type: "plot" },
  },
];

export function getSearchMode(id: string): SearchMode {
  return SEARCH_MODES.find((m) => m.id === id) || SEARCH_MODES[0];
}

export function budgetOptionsFor(category: PropertyCategory): SearchOption[] {
  return category === "Rent" || category === "Pg" ? RENT_BUDGETS : SALE_BUDGETS;
}

export function propertyTypeOptionsFor(mode: SearchMode): SearchOption[] {
  if (mode.category === "Commercial") return COMMERCIAL_TYPES;
  if (mode.category === "Rent" || mode.category === "Pg") return RENTAL_TYPES;
  return RESIDENTIAL_TYPES;
}

export function optionsFor(mode: SearchMode, field: SearchFieldId): SearchOption[] {
  switch (field) {
    case "propertyType":
      return propertyTypeOptionsFor(mode);
    case "budget":
      return budgetOptionsFor(mode.category);
    case "bedrooms":
      return BEDROOM_OPTIONS;
    case "possession":
      return POSSESSION_OPTIONS;
  }
}

export const FIELD_PARAM: Record<SearchFieldId, keyof SearchValues> = {
  propertyType: "type",
  budget: "budget",
  bedrooms: "bedrooms",
  possession: "possession",
};

export const FIELD_LABEL: Record<SearchFieldId, string> = {
  propertyType: "Property type",
  budget: "Budget",
  bedrooms: "Bedrooms (BHK)",
  possession: "Possession status",
};

/** Values a mode can't express are dropped when switching tabs — carrying a
 *  crore-scale budget into a Rent search, or a 3 BHK into Commercial, would
 *  silently return zero results with no explanation. */
export function valuesForMode(mode: SearchMode, values: SearchValues): SearchValues {
  const next: SearchValues = { ...EMPTY_SEARCH_VALUES, q: values.q };
  for (const field of mode.fields) {
    const param = FIELD_PARAM[field];
    const value = values[param];
    // Budget scales are disjoint between sale and rent, so a budget only
    // survives a tab switch when the new tab offers that exact key.
    if (value && optionsFor(mode, field).some((o) => o.value === value)) {
      next[param] = value;
    }
  }
  return next;
}

export type SearchErrors = Partial<Record<"q" | "form", string>>;

/** Shared by the hero panel and every listing page's keyword box, so a
 *  one-character search is rejected the same way wherever it's typed.
 *  Returns null when the (already trimmed) keyword is acceptable. */
export function validateKeyword(q: string): string | null {
  if (!q) return null;
  if (q.length < 2) return "Enter at least 2 characters to search a location.";
  if (!/[a-z0-9]/i.test(q)) return "Enter a sector, locality or project name.";
  return null;
}

/** A blank search used to submit happily and dump the user on an unfiltered
 *  listing page with no explanation of what had happened. */
export function validateSearch(mode: SearchMode, values: SearchValues): SearchErrors {
  const errors: SearchErrors = {};
  const q = values.q.trim();

  const keywordError = validateKeyword(q);
  if (keywordError) errors.q = keywordError;

  const hasFilter = mode.fields.some((field) => Boolean(values[FIELD_PARAM[field]]));
  if (!q && !hasFilter) {
    errors.form = `Add a location or choose at least one filter to search ${mode.searchNoun}.`;
  }

  return errors;
}

export function hasErrors(errors: SearchErrors): boolean {
  return Object.keys(errors).length > 0;
}

/** Builds the listing URL for a validated search. */
export function buildSearchUrl(mode: SearchMode, values: SearchValues): string {
  const params = new URLSearchParams();
  const q = values.q.trim();
  if (q) params.set("q", q);
  for (const field of mode.fields) {
    const param = FIELD_PARAM[field];
    const value = values[param];
    if (value) params.set(param, value);
  }
  for (const [key, value] of Object.entries(mode.fixedParams || {})) {
    params.set(key, value);
  }
  const query = params.toString();
  return query ? `${mode.route}?${query}` : mode.route;
}
