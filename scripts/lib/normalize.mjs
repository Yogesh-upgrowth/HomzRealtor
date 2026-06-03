// Pure normalization helpers for the ingestion pipeline.
// Derives structured fields from raw homzbackend API records.

export const CITY_META = {
  ggn: { name: "Gurgaon", state: "Haryana" },
  delhi: { name: "Delhi", state: "Delhi" },
  faridabad: { name: "Faridabad", state: "Haryana" },
  gNoida: { name: "Greater Noida", state: "Uttar Pradesh" },
  noida: { name: "Noida", state: "Uttar Pradesh" },
};

// Canonical slug — MUST match components/utils/slugify.ts (used to build URLs).
export const slugify = (text) =>
  (text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");

// Multi-word builders that should not be reduced to a single token.
const KNOWN_BUILDERS = [
  "Signature Global",
  "Smart World",
  "Central Park",
  "Anant Raj",
  "Hero Homes",
  "County Group",
  "Trump Towers",
  "M3M",
  "DLF",
  "Godrej",
  "Tata",
  "Sobha",
  "Birla",
  "Adani",
  "Emaar",
  "Bestech",
  "Ireo",
  "Vatika",
  "Conscient",
  "Puri",
  "Experion",
  "Whiteland",
  "Krisumi",
  "Elan",
  "AIPL",
  "Paras",
  "Trevoc",
  "ATS",
  "Gaur",
  "Gaursons",
  "Mahagun",
  "Eldeco",
  "Prateek",
  "Supertech",
  "Sikka",
  "Bhutani",
  "Saya",
  "Tarc",
  "BPTP",
  "Pioneer",
  "Raheja",
  "Ambience",
  "Microtek",
  "Max",
  "Ace",
  "Spaze",
  "Orris",
  "Ansal",
  "Unitech",
  "Indiabulls",
  "Pyramid",
  "Ninex",
  "ROF",
  "Adore",
  "SS Group",
  "Brisk",
];

export function extractBuilder(projectTitle, builderDescription) {
  const title = (projectTitle || "").trim();
  for (const b of KNOWN_BUILDERS) {
    if (title.toLowerCase().startsWith(b.toLowerCase())) return b;
  }
  // Fallback: first word of the project title.
  const first = title.split(/\s+/)[0];
  return first || null;
}

export function extractSector(...texts) {
  const blob = texts
    .flatMap((t) => (Array.isArray(t) ? t : [t]))
    .filter(Boolean)
    .join(" ");
  const m = blob.match(/\bSector\s*-?\s*([0-9]{1,3}[A-Za-z]?)\b/i);
  return m ? `Sector ${m[1].toUpperCase()}` : null;
}

const MICRO_MARKETS = [
  "Dwarka Expressway",
  "Golf Course Extension Road",
  "Golf Course Road",
  "Southern Peripheral Road",
  "Sohna Road",
  "New Gurgaon",
  "MG Road",
  "Yamuna Expressway",
  "Noida Extension",
  "Greater Noida West",
  "Yeida",
  "Najafgarh Road",
  "NH-48",
  "NH-8",
  "NH-24",
];

export function extractMicroMarket(...texts) {
  const blob = texts
    .flatMap((t) => (Array.isArray(t) ? t : [t]))
    .filter(Boolean)
    .join(" ");
  for (const mm of MICRO_MARKETS) {
    if (blob.toLowerCase().includes(mm.toLowerCase())) return mm;
  }
  return null;
}

// Parse Indian currency notations to INR. Returns array of numbers found.
function parseAmounts(text) {
  if (!text) return [];
  const out = [];
  const re = /([\d]+(?:\.\d+)?)\s*(cr(?:ore)?s?|lakh?s?|lac?s?|l|k)\b/gi;
  let m;
  while ((m = re.exec(text)) !== null) {
    const value = parseFloat(m[1]);
    const unit = m[2].toLowerCase();
    let mult = 1;
    if (unit.startsWith("cr")) mult = 1e7;
    else if (unit.startsWith("lakh") || unit.startsWith("lac") || unit === "l")
      mult = 1e5;
    else if (unit === "k") mult = 1e3;
    out.push(Math.round(value * mult));
  }
  return out;
}

export function extractPriceRange(priceText, priceList) {
  let amounts = parseAmounts(priceText);
  if (amounts.length === 0 && Array.isArray(priceList)) {
    for (const p of priceList) amounts.push(...parseAmounts(p?.price));
  }
  amounts = amounts.filter((n) => n > 0);
  if (amounts.length === 0) return { min: null, max: null };
  return { min: Math.min(...amounts), max: Math.max(...amounts) };
}

export function extractSizeRange(sizeText) {
  if (!sizeText) return { min: null, max: null };
  const nums = (String(sizeText).match(/\d+(?:\.\d+)?/g) || []).map(Number);
  if (nums.length === 0) return { min: null, max: null };
  return { min: Math.min(...nums), max: Math.max(...nums) };
}

const MONTHS = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

export function extractPossessionDate(possessionText) {
  if (!possessionText) return null;
  const t = possessionText.toLowerCase();
  const m = t.match(/([a-z]{3,9})[\s-]*(\d{4})/);
  if (m) {
    const mon = MONTHS[m[1].slice(0, 3)];
    const year = parseInt(m[2], 10);
    if (mon && year) {
      return `${year}-${String(mon).padStart(2, "0")}-01`;
    }
  }
  const yearOnly = t.match(/\b(20\d{2})\b/);
  if (yearOnly) return `${yearOnly[1]}-12-01`;
  return null;
}

export function parseDistanceKm(distanceText) {
  if (!distanceText) return null;
  const m = String(distanceText).match(/([\d.]+)\s*(km|m)\b/i);
  if (!m) return null;
  const val = parseFloat(m[1]);
  if (Number.isNaN(val)) return null;
  return m[2].toLowerCase() === "m" ? val / 1000 : val;
}

// Map a raw record + context to a normalized project row.
export function normalizeProject(raw, cityKey, category) {
  const meta = CITY_META[cityKey] || { name: null, state: null };
  const name = raw.projectTitle || "Untitled Project";
  const builder = extractBuilder(name, raw.builderDescription);
  const sector = extractSector(name, raw.aboutProject, raw.location);
  const microMarket = extractMicroMarket(name, raw.aboutProject, raw.location);
  const price = extractPriceRange(raw.price, raw.priceList);
  const size = extractSizeRange(raw.size);
  const possessionDate = extractPossessionDate(raw.possession);

  const propertyType =
    raw.BHKType ||
    (category === "Commercial" ? "Commercial" : null);

  return {
    city_key: cityKey,
    slug: slugify(name),
    project_name: name,
    builder,
    property_category: category,
    property_type: propertyType,
    project_status: raw.projectStatus || null,
    rera_id: raw.reraId || null,
    sector,
    micro_market: microMarket,
    city_name: meta.name,
    state: meta.state,
    possession_text: raw.possession || null,
    possession_date: possessionDate,
    price_text: raw.price || null,
    min_price_inr: price.min,
    max_price_inr: price.max,
    min_size: size.min,
    max_size: size.max,
    size_unit: raw.size ? "sq.ft" : null,
    land_area: raw.totalArea || null,
    images: Array.isArray(raw.images) ? raw.images : [],
    about: Array.isArray(raw.aboutProject) ? raw.aboutProject : [],
    amenities: Array.isArray(raw.amenities) ? raw.amenities : [],
    price_list: Array.isArray(raw.priceList) ? raw.priceList : [],
  };
}

export function normalizeLandmarks(raw) {
  const out = [];
  const lm = raw.landmarks;
  if (!lm || typeof lm !== "object") return out;
  for (const [category, list] of Object.entries(lm)) {
    if (!Array.isArray(list)) continue;
    list.forEach((item, idx) => {
      if (!item?.name) return;
      out.push({
        category,
        name: item.name,
        distance_text: item.distance || null,
        distance_km: parseDistanceKm(item.distance),
        sort_order: idx,
      });
    });
  }
  return out;
}
