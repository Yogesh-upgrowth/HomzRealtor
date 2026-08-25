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
};

// NewsData's own topical relevance is loose — q=Gurgaon alone surfaces
// traffic-accident, civic and hospitality stories that merely mention the
// city. Broad infra terms like "expressway"/"construction" turned out to
// false-positive on exactly that (a fatal-accident story mentioning "DME"
// in its body, a streetlight-funds corruption story) — this re-filters to
// vocabulary that only shows up in genuine property-market coverage.
const REAL_ESTATE_RE =
  /real estate|realty market|\brealty\b|\bpropert(y|ies)\b|housing project|housing sale|residential project|residential market|commercial project|apartment project|builder floor|circle rate|\brera\b|possession of (flats|homes|apartments|units)|new launch project|luxury housing|affordable housing|\breit(s)?\b|office space/i;

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

function relevantItems(raw: RawArticle[]): NewsItem[] {
  const items: NewsItem[] = [];
  for (const article of raw) {
    const item = toNewsItem(article);
    if (!item) continue;
    if (NOISE_RE.test(item.sourceName || "")) continue;
    if (!REAL_ESTATE_RE.test(`${item.title} ${item.description || ""}`)) continue;
    items.push(item);
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

    const seen = new Set<string>();
    const items: NewsItem[] = [];
    for (const item of [...relevantItems(gurgaonRaw), ...ncrOnly(relevantItems(marketRaw))]) {
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
