// Deterministic, data-driven section content built from the real data we already
// fetch (Google connectivity/landmarks + price insights + the view model). Used
// as a reliable fallback when the AI narrative is unavailable, so the Location /
// Market / Investment sections are ALWAYS populated with factual project data.
// Output is markdown-ish text: blank-line-separated blocks, "## " => heading —
// matching the RichText renderer in LocationIntelligence/InvestmentAnalysis/etc.

import { formatInr, type NormalizedProject } from "./normalize";
import type { ConnectivityItem, LandmarksMap } from "./geo";
import type { PriceInsightsData } from "./projects";
import type { ProjectView } from "./view-model";

function pctDiff(value: number, base: number): number {
  if (!base) return 0;
  return Math.round(((value - base) / base) * 100);
}

// ── Location & connectivity (Home Buyer tab) ─────────────────────────────────
export function buildLocationSummary(
  project: NormalizedProject,
  connectivity: ConnectivityItem[],
  landmarks: LandmarksMap
): string {
  const blocks: string[] = [];
  const loc = [project.sector, project.micro_market].filter(Boolean).join(", ");
  const where = loc ? `${loc}, ${project.city_name}` : `${project.city_name}, ${project.state}`;

  blocks.push("## Location & Connectivity");
  blocks.push(
    `${project.project_name} is located in ${where}, one of the actively developing pockets of ${project.city_name}.`
  );

  const conn = connectivity.filter((c) => c.distance_km != null || c.travel_time);
  if (conn.length) {
    const sentences = conn.map((c) => {
      const dist = c.distance_km != null ? `${c.distance_km.toFixed(1)} km` : null;
      const time = c.travel_time ? `about ${c.travel_time} by road` : null;
      const tail = [dist, time].filter(Boolean).join(", ");
      return `${c.label}${tail ? ` — ${tail}` : ""}`;
    });
    blocks.push(`Connectivity at a glance: ${sentences.join("; ")}.`);
  }

  const catOrder = [
    "Metro Stations",
    "Schools",
    "Hospitals",
    "Shopping Centres",
    "Supermarkets",
    "Parks",
    "Gyms",
    "Restaurants",
  ];
  const nearbyBits: string[] = [];
  for (const cat of catOrder) {
    const list = landmarks[cat];
    if (!list || !list.length) continue;
    const nearest = [...list].sort((a, b) => a.distance_km - b.distance_km)[0];
    nearbyBits.push(
      `${list.length} ${cat.toLowerCase()} (nearest ${nearest.name}, ${nearest.distance_text})`
    );
  }
  if (nearbyBits.length) {
    blocks.push("## What's Nearby");
    blocks.push(`Within the immediate neighbourhood you'll find ${nearbyBits.join(", ")}.`);
    blocks.push(
      `This mix of daily-needs retail, schooling and healthcare makes ${project.project_name} convenient for everyday living.`
    );
  }

  return blocks.join("\n\n");
}

// ── Price & market position (Investor tab) ───────────────────────────────────
export function buildMarketSummary(
  project: NormalizedProject,
  priceData: PriceInsightsData | null
): string {
  const blocks: string[] = [];
  const area = project.micro_market || project.city_name;

  blocks.push("## Price & Market Position");

  if (priceData && priceData.project_min_inr) {
    const p = priceData.project_min_inr;
    blocks.push(`Asking prices at ${project.project_name} start around ${formatInr(p)}.`);

    const cmp: string[] = [];
    if (priceData.micro_market_avg_inr) {
      const d = pctDiff(p, priceData.micro_market_avg_inr);
      cmp.push(
        `${Math.abs(d)}% ${d >= 0 ? "above" : "below"} the ${priceData.micro_market || area} average (${formatInr(priceData.micro_market_avg_inr)})`
      );
    }
    if (priceData.city_avg_inr) {
      const d = pctDiff(p, priceData.city_avg_inr);
      cmp.push(
        `${Math.abs(d)}% ${d >= 0 ? "above" : "below"} the ${priceData.city_name} average (${formatInr(priceData.city_avg_inr)})`
      );
    }
    if (cmp.length) blocks.push(`That positions it roughly ${cmp.join(", and ")}.`);
  } else if (project.price_text) {
    blocks.push(`Current pricing for ${project.project_name}: ${project.price_text}.`);
  } else {
    blocks.push(
      `Pricing for ${project.project_name} is available on request — reach out for the latest quote.`
    );
  }

  if (project.possession_text) {
    blocks.push(
      `Possession is planned around ${project.possession_text}, a key input when weighing entry price against the expected holding period.`
    );
  }

  return blocks.join("\n\n");
}

// ── Investment snapshot (Investor tab) ───────────────────────────────────────
export function buildInvestmentSummary(
  view: ProjectView,
  project: NormalizedProject,
  connectivity: ConnectivityItem[],
  priceData: PriceInsightsData | null
): string {
  const blocks: string[] = [];
  blocks.push("## Investment Snapshot");

  const s = view.investmentScore;
  if (s) {
    blocks.push(
      `${project.project_name} carries a HomzRealtor Investment Score of ${s.score}/100 (${s.grade}). ${s.verdict}`
    );
  }

  const drivers: string[] = [];
  if (view.status && view.status !== "Status on request")
    drivers.push(`current status is ${view.status.toLowerCase()}`);
  if (view.possession) drivers.push(`possession around ${view.possession}`);
  const connCount = connectivity.filter((c) => c.distance_km != null).length;
  if (connCount) drivers.push(`${connCount} key connectivity anchors mapped nearby`);
  if (priceData?.micro_market_avg_inr && priceData.project_min_inr) {
    const d = pctDiff(priceData.project_min_inr, priceData.micro_market_avg_inr);
    drivers.push(
      `entry price ${Math.abs(d)}% ${d >= 0 ? "above" : "below"} the ${priceData.micro_market || project.city_name} average`
    );
  }
  if (drivers.length) blocks.push(`Key factors for investors: ${drivers.join("; ")}.`);

  blocks.push(
    `Weigh these signals against your budget, holding horizon and risk appetite. Figures here are indicative and not a guarantee of returns.`
  );

  return blocks.join("\n\n");
}
