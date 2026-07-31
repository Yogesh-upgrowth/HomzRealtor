// OpenAI content generation for project intelligence sections.
// Generated ONCE per project then cached via Next.js unstable_cache (30 days).
// On Vercel this persists in their Data Cache — survives across deploys.

import { unstable_cache } from "next/cache";
import OpenAI from "openai";
import type { NormalizedProject, } from "./normalize";
import { formatInr } from "./normalize";
import { clean } from "./view-model";
import type { LandmarksMap, ConnectivityItem } from "./geo";
import { reraPortalFor } from "./rera";

// Constructed lazily on first use — the SDK constructor throws when no API key
// is configured, and doing that at import time crashes every page that imports
// this module (and `next build`) in environments without the key. Lazy, the
// throw lands in the existing catch paths and pages degrade to fallback content.
let openaiClient: OpenAI | null = null;
function getOpenAI(): OpenAI {
  openaiClient ??= new OpenAI({
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  });
  return openaiClient;
}

const MODEL = process.env.AI_INTEGRATIONS_OPENAI_MODEL ?? "gpt-4o-mini";

// Bump this to invalidate previously cached AI content (e.g. after model/prompt changes).
const CONTENT_CACHE_VERSION = "v2";

export type FaqItem = { q: string; a: string };

export type ProjectContent = {
  location_intelligence: string;
  investment_analysis: string;
  area_market_insights: string;
  builder_profile: string;
  faq: FaqItem[];
};

function buildFacts(
  project: NormalizedProject,
  landmarks: LandmarksMap,
  connectivity: ConnectivityItem[]
) {
  const landmarkSummary: Record<string, string[]> = {};
  for (const [cat, list] of Object.entries(landmarks)) {
    landmarkSummary[cat] = list.slice(0, 4).map((l) => `${l.name} (${l.distance_text})`);
  }
  return {
    name: project.project_name,
    builder: project.builder,
    city: project.city_name,
    state: project.state,
    sector: project.sector,
    micro_market: project.micro_market,
    property_category: project.property_category,
    property_type: project.property_type,
    rera_id: project.rera_id,
    possession: project.possession_text,
    price_range:
      project.min_price_inr != null
        ? `${formatInr(project.min_price_inr)} – ${formatInr(project.max_price_inr)}`
        : project.price_text,
    amenities_count: Array.isArray(project.amenities)
      ? project.amenities.reduce(
          (n: number, c: any) => n + (Array.isArray(c?.amenities) ? c.amenities.length : 0),
          0
        )
      : 0,
    nearby_landmarks: landmarkSummary,
    connectivity: connectivity.map((c) => ({
      to: c.label,
      distance_km: c.distance_km != null ? Number(c.distance_km).toFixed(1) : null,
      travel_time: c.travel_time,
    })),
  };
}

const SYSTEM = `You are a senior Indian real-estate content writer for HomzRealtor.
Write factual, specific, SEO-friendly content grounded ONLY in the provided project data.
Rules:
- Never invent prices, dates, distances, or names not present in the data.
- Reference the project name, builder, sector/locality, city and property type naturally.
- Content must be unique to THIS project — no generic boilerplate that fits any project.
- Confident, informative tone for Indian home buyers and investors.
- Use Indian number formats (Cr, Lakh) for money.
Return STRICT JSON only — no markdown fences around it.`;

async function callOpenAI(
  project: NormalizedProject,
  landmarks: LandmarksMap,
  connectivity: ConnectivityItem[]
): Promise<ProjectContent> {
  const facts = buildFacts(project, landmarks, connectivity);

  const prompt = `Project data (JSON):
${JSON.stringify(facts, null, 2)}

Return a JSON object with exactly these 5 keys:

"location_intelligence"  — 2–3 paragraphs (130–200 words total). Cover: locality/sector strengths, connectivity highlights (use the connectivity data), nearby social infrastructure (use landmark categories). Separate paragraphs with a blank line.

"investment_analysis"  — 260–360 words. Use 3 markdown subheadings prefixed with "## " (e.g. "## Pricing & Value", "## Location Growth", "## Why Invest Now"). Reference price range, possession timeline, builder reputation, location growth drivers, rental/appreciation potential. Separate sections with blank lines.

"area_market_insights"  — 200–270 words market overview for ${project.micro_market || project.city_name}. Cover: current demand, infrastructure projects, rental outlook, price appreciation trends. Use 2 markdown "## " subheadings.

"builder_profile"  — 150–210 words on ${project.builder} as a real estate developer in India. Cover: company background, portfolio scale, project quality, why buyers trust them. Natural tone, no bullet points.

"faq"  — array of 8 objects { "q": "...", "a": "..." }. Cover: price, possession, RERA, builder, location, property type, nearest metro, investment potential. Answers must use actual data from the facts above.`;

  let parsed: any = {};
  try {
    const response = await getOpenAI().chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });
    parsed = JSON.parse(response.choices[0]?.message?.content || "{}");
  } catch (err) {
    console.error("[intelligence/content] AI call failed:", err);
    // Rethrow so unstable_cache does NOT persist an empty payload for a
    // transient failure. The caller falls back to empty content for this
    // request, and the next request retries generation.
    throw err;
  }

  const aiFaq: FaqItem[] = Array.isArray(parsed.faq)
    ? parsed.faq
        .filter((f: any) => f?.q && f?.a)
        .map((f: any) => ({ q: String(f.q), a: String(f.a) }))
    : [];

  return {
    location_intelligence: String(parsed.location_intelligence || "").trim(),
    investment_analysis: String(parsed.investment_analysis || "").trim(),
    area_market_insights: String(parsed.area_market_insights || "").trim(),
    builder_profile: String(parsed.builder_profile || "").trim(),
    faq: aiFaq.length > 0 ? aiFaq : buildFallbackFaqs(project),
  };
}

export function buildFallbackFaqs(project: NormalizedProject): FaqItem[] {
  const faqs: FaqItem[] = [];
  const name = project.project_name;
  const priceText = clean(project.price_text);
  const possessionText = clean(project.possession_text);
  const reraId = clean(project.rera_id);
  const propertyType = clean(project.property_type);
  const cityName = clean(project.city_name) || "the city";
  const builder = clean(project.builder) || "a reputed developer";
  const location = [clean(project.sector), clean(project.city_name)].filter(Boolean).join(", ");

  if (priceText) {
    faqs.push({
      q: `What is the price of ${name}?`,
      a: `${name} is priced at ${priceText}. Please contact HomzRealtor for the latest pricing and available payment plans.`,
    });
  }

  if (possessionText) {
    faqs.push({
      q: `What is the possession date for ${name}?`,
      a: `The expected possession date for ${name} is ${possessionText}. This is subject to approvals and construction progress.`,
    });
  }

  if (reraId) {
    const portal = reraPortalFor(project.state);
    faqs.push({
      q: `Is ${name} RERA registered?`,
      a: portal
        ? `Yes, ${name} is registered under RERA with ID ${reraId}. You can verify this on the official ${portal.name} portal at ${portal.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}.`
        : `Yes, ${name} is registered under RERA with ID ${reraId}. You can verify this with your state's RERA authority.`,
    });
  }

  faqs.push({
    q: `Who is the builder of ${name}?`,
    a: `${name} is developed by ${builder}, a reputed real estate developer in India known for quality construction and timely delivery.`,
  });

  faqs.push({
    q: `Where is ${name} located?`,
    a: `${name} is located in ${location || cityName}. The project enjoys excellent connectivity to major commercial and social infrastructure in the area.`,
  });

  if (propertyType) {
    faqs.push({
      q: `What types of units are available in ${name}?`,
      a: `${name} offers ${propertyType} configurations. Get in touch with HomzRealtor for current availability and floor plan details.`,
    });
  }

  faqs.push({
    q: `Is ${name} a good investment?`,
    a: `${name} by ${builder} in ${cityName} offers strong investment potential given the location, builder reputation, and ongoing infrastructure development in the area. We recommend consulting HomzRealtor's experts for a personalised investment analysis.`,
  });

  faqs.push({
    q: `How can I book a visit to ${name}?`,
    a: `You can schedule a free site visit to ${name} by filling the enquiry form on this page or calling HomzRealtor directly. Our team will arrange a guided tour at your convenience.`,
  });

  return faqs;
}

export function generateProjectContent(
  project: NormalizedProject,
  landmarks: LandmarksMap,
  connectivity: ConnectivityItem[]
): Promise<ProjectContent> {
  // Each project gets its own cache slot keyed by city+slug.
  // On Vercel this cache entry persists 30 days across deploys.
  return unstable_cache(
    () => callOpenAI(project, landmarks, connectivity),
    ["ai-content", CONTENT_CACHE_VERSION, project.city_key, project.slug],
    { revalidate: 2592000 }
  )();
}
