"use client";

// Resolves the common context (spec section 3) from the current route --
// pathname pattern matching against this app's known route shapes, never
// by reading rendered DOM text (the spec explicitly forbids that: "never
// by scraping arbitrary text from the DOM"). This is a first-pass mapping
// covering this repo's actual route families; refine per-page as real
// pages wire up their own page_view calls with more specific context than
// this generic resolver can infer from the path alone (e.g. a property
// detail page knows its own bhk/property_type, this resolver doesn't).

import type { ActorIntent, AssetClass, CommonContext, PageType, TransactionType } from "./schema";

const MAX_LOCATION = 1000;
const MAX_TITLE = 300;
const MAX_REFERRER = 420;

function truncate(value: string, max: number): string {
  return value.length > max ? value.slice(0, max) : value;
}

/** Strips everything except the path + explicitly approved attribution
 *  params, per spec section 9 ("only approved, safe attribution
 *  parameters... no raw user input, query text, hash, phone or email").
 *  No UTMs are actually emitted by this site's own internal links (spec
 *  section 9 also says never add UTMs internally), so for now this keeps
 *  the path only -- safe by construction, since there's nothing sensitive
 *  left to accidentally leak once the query string is dropped entirely. */
function sanitizeLocation(pathname: string): string {
  const clean = `https://www.homzrealtor.com${pathname.split("?")[0].split("#")[0]}`;
  return truncate(clean, MAX_LOCATION);
}

function sanitizeReferrer(raw: string | null | undefined): string {
  if (!raw) return "";
  try {
    const url = new URL(raw);
    // Internal referrer: path only, no query (may carry submitted search
    // text or filters). External referrer: origin only, never the full
    // external URL (which could carry the visitor's own search query).
    if (url.hostname === "www.homzrealtor.com" || url.hostname === "homzrealtor.com") {
      return truncate(`https://www.homzrealtor.com${url.pathname}`, MAX_REFERRER);
    }
    return truncate(url.origin, MAX_REFERRER);
  } catch {
    return "";
  }
}

function classifyPageType(pathname: string): PageType {
  if (pathname === "/") return "home";
  if (pathname.startsWith("/project-listing/compare/")) return "compare";
  if (pathname.startsWith("/developer/")) return "developer";
  if (pathname === "/developer") return "developer";
  if (/^\/project-listing\/[^/]+\/sectors\/[^/]+/.test(pathname)) return "sector";
  if (/^\/project-listing\/[^/]+\/[^/]+/.test(pathname)) return "project_detail";
  if (pathname.startsWith("/project-listing")) return "collection";
  if (/^\/(buy-property|rent-property|commercial|pg-property)\/[^/]+\/[^/]+/.test(pathname)) return "property_detail";
  if (/^\/(buy-property|rent-property|commercial|pg-property)/.test(pathname)) return "collection";
  if (pathname.startsWith("/blog/") || pathname.startsWith("/property-insights/")) return "article";
  if (pathname === "/contact") return "contact";
  if (pathname.startsWith("/sell-property")) return "seller";
  if (pathname.startsWith("/rent-out-property")) return "landlord";
  return "other";
}

function classifyTransactionAsset(pathname: string): { transaction_type: TransactionType; asset_class: AssetClass } {
  if (/^\/(buy-property|project-listing)/.test(pathname)) return { transaction_type: "sale", asset_class: "residential" };
  if (pathname.startsWith("/rent-property") || pathname.startsWith("/pg-property")) {
    return { transaction_type: "rent", asset_class: "residential" };
  }
  // Commercial pages support both sale and lease with no explicit choice
  // made yet at the hub level -- spec section 2: "a commercial page
  // without a sale/rent choice remains transaction_type=unknown."
  if (pathname.startsWith("/commercial")) return { transaction_type: "unknown", asset_class: "commercial" };
  return { transaction_type: "unknown", asset_class: "unknown" };
}

// This site's sole focus market today -- see CITY_DISPLAY/CITY_META
// throughout lib/intelligence/. Utility/account pages that aren't about
// inventory get "unknown" rather than a guessed city.
const NO_CITY_CONTEXT = new Set([
  "/contact", "/about-us", "/faq", "/terms", "/privacy-policy", "/disclaimer",
  "/login", "/signup", "/account", "/dashboard",
]);

function classifyCity(pathname: string): string {
  if (NO_CITY_CONTEXT.has(pathname) || pathname.startsWith("/dashboard") || pathname.startsWith("/account")) {
    return "unknown";
  }
  return "gurgaon";
}

/** actor_intent defaults to unknown at this generic, route-level layer --
 *  spec section 2: "infer intent only from an explicit tab, route context
 *  or form choice." A specific page (e.g. a rent hub, or a form after the
 *  user picks Sell Property) should override this with its own known
 *  intent when it fires page-specific events; this resolver only knows
 *  enough to set it for the plainly-unambiguous rent/buy hub cases. */
function classifyActorIntent(pathname: string): ActorIntent {
  if (pathname.startsWith("/rent-property") || pathname.startsWith("/pg-property")) return "tenant";
  if (pathname.startsWith("/buy-property") || pathname.startsWith("/project-listing")) return "buyer";
  if (pathname.startsWith("/sell-property")) return "seller";
  if (pathname.startsWith("/rent-out-property")) return "landlord";
  return "unknown";
}

export function resolvePageContext(pathname: string, referrer?: string | null): CommonContext {
  const { transaction_type, asset_class } = classifyTransactionAsset(pathname);
  return {
    schema_version: "1.0",
    page_type: classifyPageType(pathname),
    actor_intent: classifyActorIntent(pathname),
    transaction_type,
    asset_class,
    city: classifyCity(pathname),
    page_location: sanitizeLocation(pathname),
    page_title: truncate(typeof document !== "undefined" ? document.title : "", MAX_TITLE),
    page_referrer: sanitizeReferrer(referrer ?? (typeof document !== "undefined" ? document.referrer : "")),
  };
}
