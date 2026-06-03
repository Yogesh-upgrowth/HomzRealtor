// AI content generation — used ONCE per project during ingestion.
// Uses Replit-managed OpenAI access (no user API key required).

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const MODEL = "gpt-5-mini";

function inr(n) {
  if (n == null) return null;
  const cr = n / 1e7;
  if (cr >= 1) return `₹${cr.toFixed(2)} Cr`;
  const lakh = n / 1e5;
  return `₹${lakh.toFixed(2)} Lakh`;
}

// Build a compact factual brief the model must ground its writing in.
function buildFacts(project, landmarks, connectivity) {
  const landmarkSummary = {};
  for (const [cat, list] of Object.entries(landmarks)) {
    landmarkSummary[cat] = list
      .slice(0, 4)
      .map((l) => `${l.name} (${l.distance_text || ""})`.trim());
  }
  const connSummary = connectivity.map((c) => ({
    to: c.label,
    distance_km: c.distance_km ? Number(c.distance_km).toFixed(1) : null,
    travel_time: c.travel_time,
  }));

  return {
    name: project.project_name,
    builder: project.builder,
    city: project.city_name,
    state: project.state,
    sector: project.sector,
    micro_market: project.micro_market,
    property_category: project.property_category,
    property_type: project.property_type,
    project_status: project.project_status,
    rera_id: project.rera_id,
    possession: project.possession_text,
    price_range:
      project.min_price_inr != null
        ? `${inr(Number(project.min_price_inr))} - ${inr(
            Number(project.max_price_inr),
          )}`
        : project.price_text,
    size_range:
      project.min_size != null
        ? `${project.min_size} - ${project.max_size} ${project.size_unit || "sq.ft"}`
        : null,
    land_area: project.land_area,
    amenities_count: Array.isArray(project.amenities)
      ? project.amenities.reduce(
          (n, c) => n + (Array.isArray(c.amenities) ? c.amenities.length : 0),
          0,
        )
      : 0,
    nearby_landmarks: landmarkSummary,
    connectivity: connSummary,
  };
}

const SYSTEM = `You are a senior Indian real-estate content writer for HomzRealtor.
Write factual, specific, SEO-friendly content grounded ONLY in the provided project data.
Rules:
- Never invent prices, dates, distances, or names not present in the data.
- Reference the project name, builder, sector/locality, city and property type naturally.
- Make content unique to THIS project; no generic boilerplate that could apply to any project.
- Use a confident, informative tone for Indian home buyers and investors.
- Use Indian number formats (Cr, Lakh) when discussing money.
Return STRICT JSON only.`;

export async function generateContent(project, landmarks, connectivity) {
  const facts = buildFacts(project, landmarks, connectivity);

  const userPrompt = `Project data (JSON):
${JSON.stringify(facts, null, 2)}

Produce a JSON object with exactly these keys:
{
  "location_intelligence": "2-3 short paragraphs (140-220 words) on the location: locality/sector strengths, connectivity highlights (use the connectivity data), and nearby social infrastructure (use the landmark categories). Separate paragraphs with a blank line.",
  "investment_analysis": "A 250-380 word analysis. Use 2-3 markdown subheadings prefixed with '## ' (e.g. '## Pricing & Value', '## Connectivity & Growth', '## Why Invest'). Discuss price range, possession timeline, builder, location growth drivers and rental/appreciation potential grounded in the data. Separate blocks with blank lines.",
  "faq": [ { "q": "question", "a": "answer" } ]  // 6 to 8 Q&As using the real data (price, possession, RERA, builder, location, property type, connectivity, amenities)
}`;

  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
  });

  const txt = response.choices[0]?.message?.content || "{}";
  const parsed = JSON.parse(txt);

  return {
    location_intelligence: String(parsed.location_intelligence || "").trim(),
    investment_analysis: String(parsed.investment_analysis || "").trim(),
    faq: Array.isArray(parsed.faq)
      ? parsed.faq
          .filter((f) => f && f.q && f.a)
          .map((f) => ({ q: String(f.q), a: String(f.a) }))
      : [],
    model: MODEL,
  };
}
