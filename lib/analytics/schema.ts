// GA4 Dynamic Event Tracking Specification (HOMZ-GA4-DYNAMIC-EVENTS-2026-09-15)
// — the fixed event vocabulary + parameter dictionary from sections 3-5 of
// that spec, as runtime-checkable TypeScript. This is the schema every
// outgoing event is validated against before it ever reaches gtag — see
// send.ts. Only launch-scope events are wired to real UI yet (see that
// file's own comment for what's NOT yet connected).

export const SCHEMA_VERSION = "1.0";

// ── Controlled enums (spec section 2-3) ─────────────────────────────────────

export const ACTOR_INTENT = ["buyer", "seller", "tenant", "landlord", "unknown"] as const;
export type ActorIntent = (typeof ACTOR_INTENT)[number];

export const TRANSACTION_TYPE = ["sale", "rent", "mixed", "unknown"] as const;
export type TransactionType = (typeof TRANSACTION_TYPE)[number];

export const ASSET_CLASS = ["residential", "commercial", "land", "mixed", "unknown"] as const;
export type AssetClass = (typeof ASSET_CLASS)[number];

export const PAGE_TYPE = [
  "home", "collection", "property_detail", "project_detail", "sector", "developer",
  "article", "compare", "seller", "landlord", "contact", "other",
] as const;
export type PageType = (typeof PAGE_TYPE)[number];

export const ENTITY_TYPE = ["unit", "project"] as const;
export type EntityType = (typeof ENTITY_TYPE)[number];

export const PROPERTY_TYPE_ENUM = [
  "apartment", "builder_floor", "villa", "plot", "office", "retail", "other", "unknown",
] as const;
export type PropertyTypeEnum = (typeof PROPERTY_TYPE_ENUM)[number];

export const BHK_ENUM = ["studio", "1", "2", "3", "4", "5_plus"] as const;
export type BhkEnum = (typeof BHK_ENUM)[number];

export const RESULT_STATE = ["populated", "empty"] as const;
export type ResultState = (typeof RESULT_STATE)[number];

export const SEARCH_MODE = ["catalog", "structured", "unclassified"] as const;
export type SearchMode = (typeof SEARCH_MODE)[number];

export const SORT_ORDER = ["relevance", "price_asc", "price_desc", "newest"] as const;
export type SortOrder = (typeof SORT_ORDER)[number];

export const RESULT_ORIGIN = [
  "direct", "search", "filter", "sort", "pagination", "load_more", "back_forward",
] as const;
export type ResultOrigin = (typeof RESULT_ORIGIN)[number];

export const PLACEMENT = ["header", "hero", "card", "detail_top", "sticky_bar", "inline", "footer", "modal"] as const;
export type Placement = (typeof PLACEMENT)[number];

export const CONTACT_METHOD = ["phone", "whatsapp", "email", "web_form"] as const;
export type ContactMethod = (typeof CONTACT_METHOD)[number];

export const LEAD_TYPE = [
  "property_enquiry", "callback", "site_visit_request", "best_price",
  "sell_property", "let_property", "consultation",
] as const;
export type LeadType = (typeof LEAD_TYPE)[number];

export const ERROR_TYPE = ["validation", "network", "server", "rate_limit"] as const;
export type ErrorTypeEnum = (typeof ERROR_TYPE)[number];

export const ERROR_CODE = [
  "required_field", "invalid_format", "timeout", "rejected", "unavailable", "too_many_attempts",
] as const;
export type ErrorCodeEnum = (typeof ERROR_CODE)[number];

export const DESTINATION_TYPE = ["collection", "property", "form", "article", "contact", "other"] as const;
export type DestinationType = (typeof DESTINATION_TYPE)[number];

export const ACTION_ENUM = ["add", "remove", "view", "copy_link", "native_share", "external_handoff"] as const;
export type ActionEnum = (typeof ACTION_ENUM)[number];

// ── Common context (spec section 3) ─────────────────────────────────────────
// Every event carries this. page_location/page_title/page_referrer come from
// the router-driven page-context resolver (pageContext.ts), never scraped
// from the DOM, and are sanitized there before reaching this layer.

export type CommonContext = {
  schema_version: "1.0";
  page_type: PageType;
  actor_intent: ActorIntent;
  transaction_type: TransactionType;
  asset_class: AssetClass;
  city: string;
  micro_market?: string;
  sector?: string;
  page_location: string;
  page_title: string;
  page_referrer: string;
};

export type EntityContext = {
  entity_type?: EntityType;
  entity_id?: string;
  property_type?: PropertyTypeEnum;
  bhk?: BhkEnum;
};

// ── Per-event field allowlists ───────────────────────────────────────────────
// Keys are the exact event names from spec section 4-5. Value is the set of
// event-specific fields (beyond common+entity context) that event is allowed
// to carry. send.ts strips anything not listed here, and enforces the
// overall 25-populated-parameter budget and length caps from section 3.

export const EVENT_FIELDS: Record<string, string[]> = {
  // Standard GA4 event -- common context only (spec section 4).
  page_view: [],
  search: ["search_term", "search_mode", "result_count", "result_state", "budget_band", "property_type", "bhk", "list_id"],
  filter_apply: ["filter_name", "filter_value", "result_count", "result_state", "list_id", "budget_band", "property_type", "bhk"],
  sort_change: ["sort_order", "list_id"],
  property_list_view: ["list_id", "result_count", "visible_count", "page_number", "result_state", "result_origin", "budget_band", "property_type", "bhk"],
  property_select: ["list_id", "item_position", "page_number", "placement"],
  property_view: ["list_id"],
  contact_click: ["contact_method", "cta_id", "placement"],
  cta_click: ["cta_id", "placement", "destination_type", "content_id"],
  lead_form_open: ["form_id", "lead_type", "contact_method", "placement"],
  lead_form_start: ["form_id", "lead_type", "contact_method", "placement"],
  lead_form_submit: ["form_id", "lead_type", "contact_method", "placement"],
  lead_form_error: ["form_id", "lead_type", "error_type", "error_code"],
  generate_lead: ["form_id", "lead_type", "contact_method", "placement"],
  // Secondary (section 5) -- schemas defined now so they validate correctly
  // whenever wired up, but nothing currently calls these; see send.ts.
  property_save: ["action", "placement"],
  property_compare: ["action", "compare_count"],
  property_media_view: ["media_type", "media_index"],
  property_share: ["action", "placement"],
  brochure_click: ["placement"],
  calculator_complete: ["calculator_type"],
};

const ENUM_FIELDS: Record<string, readonly string[]> = {
  page_type: PAGE_TYPE,
  actor_intent: ACTOR_INTENT,
  transaction_type: TRANSACTION_TYPE,
  asset_class: ASSET_CLASS,
  entity_type: ENTITY_TYPE,
  property_type: PROPERTY_TYPE_ENUM,
  bhk: BHK_ENUM,
  result_state: RESULT_STATE,
  search_mode: SEARCH_MODE,
  sort_order: SORT_ORDER,
  result_origin: RESULT_ORIGIN,
  placement: PLACEMENT,
  contact_method: CONTACT_METHOD,
  lead_type: LEAD_TYPE,
  error_type: ERROR_TYPE,
  error_code: ERROR_CODE,
  destination_type: DESTINATION_TYPE,
  action: ACTION_ENUM,
};

// Section 3's length caps.
const STRING_MAX = 100;
const LENGTH_OVERRIDES: Record<string, number> = {
  page_title: 300,
  page_referrer: 420,
  page_location: 1000,
};
const MAX_POPULATED_PARAMS = 25;
const NAME_MAX = 40;

export type ValidationResult = { ok: true; params: Record<string, unknown> } | { ok: false; reason: string };

/** Validates one event's full parameter object (common + entity + event
 *  fields already merged by the caller) against the spec's rules: known
 *  event name, known fields only, enum values only, length caps, no
 *  undefined/null/empty-string placeholders, max 25 populated params. Never
 *  throws -- callers drop invalid events rather than let a bad payload
 *  reach gtag or interrupt the user's actual action (spec section 7/9). */
export function validateEvent(name: string, params: Record<string, unknown>): ValidationResult {
  if (!name || name.length > NAME_MAX || !/^[a-z][a-z0-9_]*$/.test(name)) {
    return { ok: false, reason: "invalid_event_name" };
  }
  const allowedEventFields = EVENT_FIELDS[name];
  if (!allowedEventFields) return { ok: false, reason: "unknown_event" };

  const allowedKeys = new Set([
    "schema_version", "page_type", "actor_intent", "transaction_type", "asset_class",
    "city", "micro_market", "sector", "page_location", "page_title", "page_referrer",
    "entity_type", "entity_id", "property_type", "bhk",
    ...allowedEventFields,
  ]);

  const cleaned: Record<string, unknown> = {};
  let populated = 0;

  for (const [key, value] of Object.entries(params)) {
    if (!allowedKeys.has(key)) continue; // strip anything not on this event's allowlist
    if (key.length > NAME_MAX) continue;
    if (value === undefined || value === null || value === "") continue; // never send placeholders

    if (typeof value === "string") {
      const max = LENGTH_OVERRIDES[key] ?? STRING_MAX;
      if (value.length > max) return { ok: false, reason: `${key}_too_long` };
      const enumValues = ENUM_FIELDS[key];
      if (enumValues && !enumValues.includes(value)) return { ok: false, reason: `${key}_invalid_enum` };
    } else if (typeof value === "number") {
      if (!Number.isFinite(value) || value < 0) return { ok: false, reason: `${key}_invalid_number` };
    } else {
      return { ok: false, reason: `${key}_invalid_type` };
    }

    cleaned[key] = value;
    populated++;
  }

  if (populated > MAX_POPULATED_PARAMS) return { ok: false, reason: "too_many_params" };
  if (!cleaned.schema_version) cleaned.schema_version = SCHEMA_VERSION;

  return { ok: true, params: cleaned };
}
