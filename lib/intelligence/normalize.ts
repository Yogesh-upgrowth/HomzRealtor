// Normalizes raw homzbackend API records into structured project data.
// Mirrors scripts/lib/normalize.mjs but as TypeScript for use in server components.

export const CITY_META: Record<string, { name: string; state: string }> = {
  ggn: { name: "Gurgaon", state: "Haryana" },
  delhi: { name: "Delhi", state: "Delhi" },
  faridabad: { name: "Faridabad", state: "Haryana" },
  gNoida: { name: "Greater Noida", state: "Uttar Pradesh" },
  noida: { name: "Noida", state: "Uttar Pradesh" },
};

export const KNOWN_BUILDERS = [
  "Signature Global", "Smart World", "Central Park", "Anant Raj", "Hero Homes",
  "County Group", "Trump Towers", "M3M", "DLF", "Godrej", "Tata", "Sobha",
  "Birla", "Adani", "Emaar", "Bestech", "Ireo", "Vatika", "Conscient", "Puri",
  "Experion", "Whiteland", "Krisumi", "Elan", "AIPL", "Paras", "Trevoc",
  "ATS", "Gaur", "Gaursons", "Mahagun", "Eldeco", "Prateek", "Supertech",
  "Sikka", "Bhutani", "Saya", "Tarc", "BPTP", "Pioneer", "Raheja", "Ambience",
  "Microtek", "Max", "Ace", "Spaze", "Orris", "Ansal", "Unitech", "Indiabulls",
  "Pyramid", "Ninex", "ROF", "Adore", "SS Group", "Brisk",
];

export function extractBuilder(projectTitle: string): string {
  const title = (projectTitle || "").trim();
  for (const b of KNOWN_BUILDERS) {
    if (title.toLowerCase().startsWith(b.toLowerCase())) return b;
  }
  return title.split(/\s+/)[0] || "Unknown";
}

export function extractSector(...texts: (string | string[] | null | undefined)[]): string | null {
  const blob = texts.flatMap((t) => (Array.isArray(t) ? t : [t])).filter(Boolean).join(" ");
  const m = blob.match(/\bSector\s*-?\s*([0-9]{1,3}[A-Za-z]?)\b/i);
  return m ? `Sector ${m[1].toUpperCase()}` : null;
}

const MICRO_MARKETS = [
  "Dwarka Expressway", "Golf Course Extension Road", "Golf Course Road",
  "Southern Peripheral Road", "Sohna Road", "New Gurgaon", "MG Road",
  "Yamuna Expressway", "Noida Extension", "Greater Noida West", "Yeida",
  "Najafgarh Road", "NH-48", "NH-8", "NH-24",
];

export function extractMicroMarket(...texts: (string | string[] | null | undefined)[]): string | null {
  const blob = texts.flatMap((t) => (Array.isArray(t) ? t : [t])).filter(Boolean).join(" ");
  for (const mm of MICRO_MARKETS) {
    if (blob.toLowerCase().includes(mm.toLowerCase())) return mm;
  }
  return null;
}

function parseAmounts(text: string | null | undefined): number[] {
  if (!text) return [];
  const out: number[] = [];
  const re = /([\d]+(?:\.\d+)?)\s*(cr(?:ore)?s?|lakh?s?|lac?s?|l|k)\b/gi;
  let m;
  while ((m = re.exec(text)) !== null) {
    const value = parseFloat(m[1]);
    const unit = m[2].toLowerCase();
    let mult = 1;
    if (unit.startsWith("cr")) mult = 1e7;
    else if (unit.startsWith("lakh") || unit.startsWith("lac") || unit === "l") mult = 1e5;
    else if (unit === "k") mult = 1e3;
    out.push(Math.round(value * mult));
  }
  return out;
}

export function extractPriceRange(priceText?: string | null, priceList?: any[] | null) {
  let amounts = parseAmounts(priceText);
  if (amounts.length === 0 && Array.isArray(priceList)) {
    for (const p of priceList) amounts.push(...parseAmounts(p?.price));
  }
  amounts = amounts.filter((n) => n > 0);
  if (amounts.length === 0) return { min: null, max: null };
  return { min: Math.min(...amounts), max: Math.max(...amounts) };
}

export function formatInr(n: number | null | undefined): string | null {
  if (n == null) return null;
  const cr = n / 1e7;
  if (cr >= 1) return `₹${cr.toFixed(2)} Cr`;
  return `₹${(n / 1e5).toFixed(0)} Lakh`;
}

export function slugify(text: string): string {
  return (text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

export type NormalizedProject = {
  slug: string;
  city_key: string;
  project_name: string;
  builder: string;
  property_category: string;
  property_type: string | null;
  rera_id: string | null;
  sector: string | null;
  micro_market: string | null;
  city_name: string;
  state: string;
  possession_text: string | null;
  price_text: string | null;
  min_price_inr: number | null;
  max_price_inr: number | null;
  images: string[];
  interior_images: string[];
  about: string[];
  amenities: any[];
  specifications: any[];
  price_list: any[];
  builder_description: string[];
  recent_updates: any[];
  master_plan: { image?: string; content?: string } | null;
};

export function normalizeProject(raw: any, cityKey: string, category: string): NormalizedProject {
  const meta = CITY_META[cityKey] || { name: cityKey, state: "India" };
  const name = raw.projectTitle || "Untitled Project";
  const price = extractPriceRange(raw.price, raw.priceList);

  return {
    slug: slugify(name),
    city_key: cityKey,
    project_name: name,
    builder: extractBuilder(name),
    property_category: category,
    property_type: raw.BHKType || null,
    rera_id: raw.reraId || null,
    sector: extractSector(name, raw.aboutProject, raw.location),
    micro_market: extractMicroMarket(name, raw.aboutProject, raw.location),
    city_name: meta.name,
    state: meta.state,
    possession_text: raw.possession || null,
    price_text: raw.price || null,
    min_price_inr: price.min,
    max_price_inr: price.max,
    images: Array.isArray(raw.images) ? raw.images : [],
    interior_images: Array.isArray(raw.interiorImages) ? raw.interiorImages : [],
    about: Array.isArray(raw.aboutProject) ? raw.aboutProject : [],
    amenities: Array.isArray(raw.amenities) ? raw.amenities : [],
    specifications: Array.isArray(raw.specifications) ? raw.specifications : [],
    price_list: Array.isArray(raw.priceList) ? raw.priceList : [],
    builder_description: Array.isArray(raw.builderDescription)
      ? raw.builderDescription
      : raw.builderDescription
      ? [String(raw.builderDescription)]
      : [],
    recent_updates: Array.isArray(raw.recentUpdates) ? raw.recentUpdates : [],
    master_plan:
      raw.masterPlan && (raw.masterPlan.image || raw.masterPlan.content)
        ? { image: raw.masterPlan.image, content: raw.masterPlan.content }
        : null,
  };
}
