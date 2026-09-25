// Live real-estate headlines for the homepage's "Latest News" section, via
// NewsData.io's free tier (200 credits/day, ~10 articles/credit, results
// delayed ~12h) — chosen because its free plan is the one among the common
// free news APIs whose own terms allow commercial/production display; GNews
// and NewsAPI.org's free tiers explicitly forbid production use, and Google
// News RSS restricts its feed to "personal, non-commercial" feed readers only.
// Requires NEWSDATA_API_KEY (see .env.example for sign-up steps). Same
// "never show fabricated/fallback-fake content" discipline as view-model.ts —
// if the key is missing or the API returns nothing relevant, callers get an
// empty array and the section hides itself rather than inventing headlines.

import { clean } from "./view-model";

const NEWSDATA_KEY = process.env.NEWSDATA_API_KEY;
const NEWSDATA_URL = "https://newsdata.io/api/1/latest";

export type NewsItem = {
  title: string;
  description: string | null;
  link: string;
  image: string | null;
  sourceName: string | null;
  publishedAt: string | null;
  /** The allow-listed topic this article matched. Set by relevantItems(); an
   *  item with no topic never reaches a caller. */
  topic?: string;
};

// The allow-list of topics this module will show (2026-09-22).
//
// Checklist item 12: "Restrict Homepage Latest News to Gurgaon property
// topics. Only allow categories such as: Gurgaon Real Estate, Gurgaon
// Infrastructure, Dwarka Expressway, Golf Course Extension Road, New Gurgaon,
// HARERA, Gurgaon Metro, RRTS, Developer News, Project Launches, Housing
// Finance, Office Leasing, Property Regulation. Exclude crime stories,
// celebrity property, generic Delhi news, unrelated national stories,
// sensational content."
//
// This replaces a single broad "is it real-estate vocabulary" regex. The
// difference that matters is the shape: an article now has to match a NAMED
// topic, and the topic it matched is carried on the item — so the module can
// say what it let through rather than just asserting relevance. A story that
// matches nothing on this list does not appear, whatever else it mentions.
//
// Order matters only for the label, not for admission: the first match names
// the item, so the specific corridors sit above the general Gurgaon category.
export type NewsTopic = { label: string; match: RegExp };

export const NEWS_TOPICS: NewsTopic[] = [
  { label: "Dwarka Expressway", match: /\bdwarka\s*express\s*way\b/i },
  {
    label: "Golf Course Extension Road",
    match: /golf\s*course\s*(extension|ext\.?)\s*road/i,
  },
  { label: "Golf Course Road", match: /golf\s*course\s*road/i },
  { label: "New Gurgaon", match: /\bnew\s*gur(gaon|ugram)\b/i },
  { label: "HARERA", match: /\bha?rera\b|real estate regulatory authority/i },
  {
    label: "Gurgaon Metro",
    match: /\b(gurgaon|gurugram)\b[^.]{0,60}\bmetro\b|\bmetro\b[^.]{0,60}\b(gurgaon|gurugram)\b|rapid metro/i,
  },
  { label: "RRTS", match: /\brrts\b|regional rapid transit|namo bharat/i },
  {
    label: "Housing Finance",
    match: /home loan|housing finance|\bhfc\b|loan against property|repo rate[^.]{0,40}(home|housing)|mortgage/i,
  },
  {
    label: "Office Leasing",
    match: /office leasing|office space (absorption|take-?up|demand|leased)|grade a office|co-?working (space|deal)|leasing volume/i,
  },
  {
    label: "Property Regulation",
    match: /circle rate|stamp duty|collector rate|land pooling|property tax|building bye-?laws|occupancy certificate|\bcla\b registration|apartment ownership act|land acquisition/i,
  },
  {
    label: "Project Launches",
    // "unveils a new residential project" has words between the verb and the
    // noun, so an adjacent-word pattern missed it and the story fell through
    // to Developer News. Both labels are defensible for that headline, but a
    // launch is the more specific fact, so the verb is allowed a short gap.
    match: /new launch|pre-?launch|(unveils?|launch(es|ed)?|debuts?|announces?)\b[^.]{0,40}\b(project|towers?|phase)\b|breaks? ground/i,
  },
  {
    label: "Developer News",
    match: /\b(dlf|m3m|signature global|godrej properties|emaar|sobha|birla estates|tata realty|adani realty|bptp|vatika|elan group|smart world|central park|whiteland|krisumi|experion|anant raj)\b/i,
  },
  {
    label: "Gurgaon Infrastructure",
    match: /\b(gurgaon|gurugram)\b[^.]{0,80}\b(expressway|elevated corridor|underpass|flyover|sewer|water supply|road widening|\bnh-?\d+\b|peripheral road)\b/i,
  },
  {
    label: "Gurgaon Real Estate",
    match: /\b(gurgaon|gurugram)\b[^.]{0,80}\b(real estate|realty|propert(y|ies)|housing|apartment|flats?|residential|commercial space|plots?)\b/i,
  },
  {
    label: "Indian Real Estate",
    match: /real estate|realty market|\brealty\b|residential market|housing sales|\breit(s)?\b|affordable housing|luxury housing/i,
  },
];

/**
 * Categories the item names as excluded, plus the shapes that carry them.
 *
 * Checked BEFORE the allow-list, because the overlap is exactly where the
 * problem lives: a murder in a Gurgaon condominium matches "Gurgaon Real
 * Estate" on vocabulary alone, and a Bollywood flat purchase matches
 * "Project Launches". Neither belongs in a property-market feed.
 */
const BLOCKED_RE =
  // crime
  /\b(murder|murdered|killed|kill(ing)?|rape|raped|assault|molest|shot dead|stabb(ed|ing)|suicide|body found|arrest(ed)?|held for|booked for|fir\b|police (case|complaint)|fraud(ster)?|cheat(ed|ing)|duped|scam|extortion|kidnap|robbery|loot(ed)?|snatch(ing|ed)|smuggl|drugs?\b|narcotic|gang|shootout|firing|encounter)\b|/.source +
  // celebrity property
  /\b(actor|actress|cricketer|bollywood|star kid|singer|celebrity|influencer)\b[^.]{0,60}\b(buys?|bought|purchas|sells?|sold|rents?|flat|apartment|villa|bungalow|mansion|property)\b|/.source +
  /\b(buys?|bought|purchas\w*|sells?|sold)\b[^.]{0,40}\b(for|worth)\b[^.]{0,30}\bcrore\b[^.]{0,40}\b(actor|actress|cricketer|bollywood|singer|celebrity)\b|/.source +
  // sensational framing
  /\b(shocking|horrifying|you won't believe|viral video|goes viral|caught on camera|watch:|big blow|bombshell|slams?|lashes out|war of words)\b/.source;

const BLOCKED = new RegExp(BLOCKED_RE, "i");

// Genuinely Gurgaon-specific property-market news is rare on any given day —
// tested live, an 8-page pagination of q=Gurgaon (84 total results, the
// feed's daily ceiling for that query) yielded only ~4 relevant articles.
// The second, untargeted "real estate" query below backfills the rest from
// national Indian real-estate coverage (RERA, REITs, developers) so the
// section can actually show 4-5 items most days — Gurgaon-specific results
// are still ranked first.
const NOISE_RE = /ein presswire|prnewswire|globenewswire|business ?wire/i;

// The Gurgaon-specific query above is already geo-scoped by definition —
// this only gates the second, unscoped '"real estate"' backfill query
// below, which otherwise happily pads out to `limit` with any real-estate
// story regardless of geography: a Karnataka assembly bill, a US
// Zillow/FTC story, confirmed live via audit. Delhi NCR core only.
const NCR_RE = /\b(gurgaon|gurugram|noida|greater noida|faridabad|delhi|ncr)\b/i;

type RawArticle = {
  title?: unknown;
  link?: unknown;
  description?: unknown;
  image_url?: unknown;
  source_name?: unknown;
  source_id?: unknown;
  pubDate?: unknown;
};

function toNewsItem(raw: RawArticle): NewsItem | null {
  const title = clean(raw.title);
  const link = clean(raw.link);
  if (!title || !link) return null;
  return {
    title,
    description: clean(raw.description),
    link,
    image: typeof raw.image_url === "string" && raw.image_url.trim() ? raw.image_url : null,
    sourceName: clean(raw.source_name) || clean(raw.source_id),
    publishedAt: clean(raw.pubDate),
  };
}

async function fetchPage(q: string, page?: string): Promise<{ articles: RawArticle[]; nextPage: string | null }> {
  if (!NEWSDATA_KEY) return { articles: [], nextPage: null };
  const params = new URLSearchParams({
    apikey: NEWSDATA_KEY,
    q,
    country: "in",
    language: "en",
  });
  if (page) params.set("page", page);
  const res = await fetch(`${NEWSDATA_URL}?${params.toString()}`, {
    // Free-tier data is itself ~12h delayed and rate-limited to 200
    // credits/day, so a 6h revalidate window is generous, not a bottleneck —
    // even fetching MAX_PAGES pages on both queries every one of 4
    // refreshes/day stays well under budget.
    next: { revalidate: 21600 },
  });
  if (!res.ok) return { articles: [], nextPage: null };
  const data = await res.json().catch(() => null);
  return {
    articles: Array.isArray(data?.results) ? data.results : [],
    nextPage: typeof data?.nextPage === "string" || typeof data?.nextPage === "number" ? String(data.nextPage) : null,
  };
}

const MAX_PAGES = 5;

async function fetchRaw(q: string): Promise<RawArticle[]> {
  if (!NEWSDATA_KEY) return [];
  const all: RawArticle[] = [];
  let page: string | undefined;
  for (let i = 0; i < MAX_PAGES; i++) {
    const { articles, nextPage } = await fetchPage(q, page);
    all.push(...articles);
    if (!nextPage) break;
    page = nextPage;
  }
  return all;
}

/** The first allow-listed topic an article matches, or null. */
export function classifyHeadline(text: string): string | null {
  if (BLOCKED.test(text)) return null;
  return NEWS_TOPICS.find((t) => t.match.test(text))?.label ?? null;
}

function relevantItems(raw: RawArticle[]): NewsItem[] {
  const items: NewsItem[] = [];
  for (const article of raw) {
    const item = toNewsItem(article);
    if (!item) continue;
    if (NOISE_RE.test(item.sourceName || "")) continue;
    const topic = classifyHeadline(`${item.title} ${item.description || ""}`);
    if (!topic) continue;
    items.push({ ...item, topic });
  }
  return items;
}

/** Real, live real-estate headlines, Gurgaon-specific ones first, backfilled
 *  with broader Indian real-estate market news. Returns [] — never
 *  fabricated placeholders — when the key is unset, both requests fail, or
 *  nothing in the batch is actually real-estate relevant. */
export async function getGurgaonRealEstateNews(limit = 5): Promise<NewsItem[]> {
  try {
    const [gurgaonRaw, marketRaw] = await Promise.all([
      fetchRaw("Gurgaon"),
      fetchRaw('"real estate"'),
    ]);

    const ncrOnly = (items: NewsItem[]) =>
      items.filter((i) => NCR_RE.test(`${i.title} ${i.description || ""}`));

    // Item 12's closing rule, and it is the part worth being deliberate
    // about: "If there are only three relevant property stories, show three
    // rather than filling the module with irrelevant content." So nothing
    // here pads. The list is whatever cleared the topic allow-list, in
    // Gurgaon-first order, and the section renders however many that is —
    // including none, in which case it hides itself entirely.
    //
    // Within that, the generic "Indian Real Estate" catch-all sorts last, so
    // a national REIT story never displaces a Dwarka Expressway one.
    const rank = (i: NewsItem) => (i.topic === "Indian Real Estate" ? 1 : 0);

    const seen = new Set<string>();
    const items: NewsItem[] = [];
    const candidates = [...relevantItems(gurgaonRaw), ...ncrOnly(relevantItems(marketRaw))].sort(
      (a, b) => rank(a) - rank(b)
    );
    for (const item of candidates) {
      if (seen.has(item.title)) continue;
      seen.add(item.title);
      items.push(item);
      if (items.length >= limit) break;
    }

    return items;
  } catch (err) {
    console.error("[getGurgaonRealEstateNews] fetch failed", err);
    return [];
  }
}

/**
 * Headlines about one developer in Gurgaon, newest first (developer-page
 * brief 2026-09-25, "Launch tracker"). One NewsData page per developer to
 * stay inside the free tier's daily credits. An item must name the developer
 * as a whole word AND Gurgaon/Gurugram, and clear the same topic allow-list
 * as the homepage module. Returns [] without a key or on any failure.
 */
export async function getDeveloperNews(developerName: string, limit = 10): Promise<NewsItem[]> {
  const name = String(developerName ?? "").trim();
  if (!name || !NEWSDATA_KEY) return [];
  try {
    const { articles } = await fetchPage(`"${name}" AND (Gurgaon OR Gurugram)`);
    const esc = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const nameRe = new RegExp(`\\b${esc}\\b`, "i");
    const seen = new Set<string>();
    return relevantItems(articles)
      .filter((i) => {
        const text = `${i.title} ${i.description || ""}`;
        return nameRe.test(text) && /\bgur(gaon|ugram)\b/i.test(text);
      })
      .filter((i) => (seen.has(i.title) ? false : (seen.add(i.title), true)))
      .sort((a, b) => Date.parse(b.publishedAt || "") - Date.parse(a.publishedAt || ""))
      .slice(0, limit);
  } catch (err) {
    console.error("[getDeveloperNews] fetch failed", err);
    return [];
  }
}
