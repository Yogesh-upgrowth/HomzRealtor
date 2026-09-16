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

// SEO audit 2026-09-07 P0 ("Some project copy... retains Square Yards
// wording"): the feed's free-text fields (aboutProject, builderDescription)
// sometimes include the provider's own disclosure sentence verbatim, e.g.
// "*This data is derived by the Square Yards data intelligence team...*"
// on Emaar Serenity Hills — confirmed live. Rather than editing/replacing
// that copy (which would mean writing new marketing prose without a real
// source), this drops only the offending sentence/paragraph, keeping
// everything else the feed provided untouched.
const SYNDICATION_MARKERS = [/square\s*yards/i];

function stripSyndicatedText(paragraphs: string[]): string[] {
  return paragraphs.filter((p) => !SYNDICATION_MARKERS.some((re) => re.test(p)));
}

// DEV-02 (2026-09-16): confirmed live — ATS Triumph Villas' aboutProject
// narrative states "...is registered under GGM/1051/783/2026/23" while the
// same record's own structured rera_id field is a completely different
// number ("RERA-GRG-2073-2025"), rendered separately with its own verified
// rera_status handling. Which one is actually correct is a regulatory
// lookup, not something a parser can decide (see the handoff's owner-input
// queue) — so rather than guess, this strips only the embedded
// registration-number clause from free text. The app already has one
// dedicated, status-aware place to assert a registration number; prose
// shouldn't assert a second, unverified one alongside it.
const EMBEDDED_REGULATORY_ID_RE = /\s*(?:and\s+)?is registered under\s+[A-Z0-9/-]+\.?/gi;

export function redactEmbeddedRegulatoryIds(paragraphs: string[]): string[] {
  return paragraphs.map((p) =>
    p
      .replace(EMBEDDED_REGULATORY_ID_RE, ".")
      .replace(/\.\s*\./g, ".")
      .replace(/\s{2,}/g, " ")
      .trim()
  );
}

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

// DEV-02 (2026-09-16): this used to only extract the numeric value from the
// feed's free-text size field, and normalizeProject() then hardcoded
// size_unit to "sq.ft" whenever any size text was present at all --
// silently mislabeling a project actually measured in Sq.Yd (real property
// listings in this same feed use that unit, e.g. "...-267-sqyd-apartment"),
// Sq.M or acres. A basis this codebase can't confirm (no unit detected in
// the text) now surfaces as size_unit: null rather than a guessed "sq.ft" --
// "Area not confirmed" is the honest fallback, not a fabricated one.
function detectAreaUnit(text: string): string | null {
  if (/sq\.?\s*yd|sqyd|sq\.?\s*yard|square\s*yard/i.test(text)) return "sq.yd";
  if (/sq\.?\s*m(?:eter|etre)?s?\b|sqm\b|square\s*met/i.test(text)) return "sq.m";
  if (/sq\.?\s*ft|sqft|square\s*fee?t/i.test(text)) return "sq.ft";
  if (/\bacres?\b/i.test(text)) return "acre";
  return null;
}

export function extractSizeRange(sizeText?: string | null): {
  min: number | null;
  max: number | null;
  unit: string | null;
} {
  if (!sizeText) return { min: null, max: null, unit: null };
  const text = String(sizeText);
  const unit = detectAreaUnit(text);
  const nums = (text.match(/\d+(?:\.\d+)?/g) || []).map(Number);
  if (nums.length === 0) return { min: null, max: null, unit };
  return { min: Math.min(...nums), max: Math.max(...nums), unit };
}

// Exact rupees with Indian grouping, e.g. 68543 → "₹68,543". Use for monthly /
// small amounts (EMI, rent, maintenance) where Lakh/Cr rounding loses meaning.
export function formatInrExact(n: number | null | undefined): string | null {
  if (n == null) return null;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

// Short Lakh/Cr formatting for large amounts (property prices, totals). Keeps
// meaningful precision for sub-crore values and falls back to exact rupees under
// ₹1 Lakh so small numbers never collapse to "₹0 Lakh"/"₹1 Lakh".
export function formatInr(n: number | null | undefined): string | null {
  if (n == null) return null;
  const abs = Math.abs(n);
  if (abs >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (abs >= 1e5) {
    const l = n / 1e5;
    return `₹${Number.isInteger(l) ? l.toFixed(0) : l.toFixed(2)} Lakh`;
  }
  return formatInrExact(n);
}

// Truncates at the last whole word before maxLength and appends an ellipsis,
// instead of hard-cutting mid-word (e.g. "...beautifully designed high-str").
// No-op (returns the original string) if it already fits.
export function truncateAtWord(text: string, maxLength = 158): string {
  if (!text || text.length <= maxLength) return text;
  const cut = text.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(" ");
  const safe = lastSpace > 0 ? cut.slice(0, lastSpace) : cut;
  return `${safe.trimEnd()}…`;
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
  project_status: string | null;
  rera_id: string | null;
  /** "active" | "lapsed" | "unverified" | "not_registered" — a correctly
   *  shaped rera_id is not the same as an active registration (see
   *  ReraBadge). Absent on older cached feed responses; treat as unknown. */
  rera_status: string | null;
  rera_valid_upto: string | null;
  rera_registered_with: string | null;
  rera_certificate_url: string | null;
  sector: string | null;
  micro_market: string | null;
  city_name: string;
  state: string;
  possession_text: string | null;
  price_text: string | null;
  min_price_inr: number | null;
  max_price_inr: number | null;
  min_size: number | null;
  max_size: number | null;
  size_unit: string | null;
  images: string[];
  interior_images: string[];
  about: string[];
  amenities: any[];
  specifications: any[];
  price_list: any[];
  builder_description: string[];
  recent_updates: any[];
  master_plan: { image?: string; content?: string } | null;
  /** Raw feed updatedAt, carried through so callers (the sitemap) can use a
   *  real per-record lastModified without re-fetching outside this shared
   *  normalization pipeline — see DEV-01, docs/seo/implementation-status.md. */
  updated_at: string | null;
};

// DEV-02 (2026-09-16): confirmed live — M3M Latitude, SS Camasa and DLF The
// Summit are all fetched from the ggnCommercialProjects segment (the
// upstream source's own category bucket) despite every one of them being an
// unambiguous residential apartment project ("3-4 BHK apartments", "512
// spacious homes", "residential towers"). BHKType ("Bedroom Hall Kitchen")
// is a configuration format that only ever describes a residential unit,
// so its presence is a narrow, reliable signal the upstream bucket is
// wrong — this only ever corrects Commercial -> Residential, never the
// other direction, since a project merely mentioning "commercial" in
// passing isn't remotely the same strength of evidence.
function hasResidentialConfiguration(bhkType: unknown): boolean {
  return typeof bhkType === "string" && /\bBHK\b/i.test(bhkType);
}

export function normalizeProject(raw: any, cityKey: string, category: string): NormalizedProject {
  const meta = CITY_META[cityKey] || { name: cityKey, state: "India" };
  const name = raw.projectTitle || "Untitled Project";
  const price = extractPriceRange(raw.price, raw.priceList);
  const size = extractSizeRange(raw.size);
  const effectiveCategory =
    category === "Commercial" && hasResidentialConfiguration(raw.BHKType) ? "Residential" : category;

  return {
    slug: slugify(name),
    city_key: cityKey,
    project_name: name,
    builder: extractBuilder(name),
    property_category: effectiveCategory,
    property_type: raw.BHKType || null,
    project_status: raw.projectStatus || null,
    rera_id: raw.reraId || null,
    rera_status: raw.reraStatus || null,
    rera_valid_upto: raw.reraValidUpto || null,
    rera_registered_with: raw.reraRegisteredWith || null,
    rera_certificate_url: raw.reraCertificateUrl || null,
    sector: extractSector(name, raw.aboutProject, raw.location),
    micro_market: extractMicroMarket(name, raw.aboutProject, raw.location),
    city_name: meta.name,
    state: meta.state,
    possession_text: raw.possession || null,
    price_text: raw.price || null,
    min_price_inr: price.min,
    max_price_inr: price.max,
    min_size: size.min,
    max_size: size.max,
    size_unit: size.unit,
    images: Array.isArray(raw.images) ? raw.images : [],
    interior_images: Array.isArray(raw.interiorImages) ? raw.interiorImages : [],
    about: stripSyndicatedText(
      redactEmbeddedRegulatoryIds(Array.isArray(raw.aboutProject) ? raw.aboutProject : [])
    ),
    amenities: Array.isArray(raw.amenities) ? raw.amenities : [],
    specifications: Array.isArray(raw.specifications) ? raw.specifications : [],
    price_list: Array.isArray(raw.priceList) ? raw.priceList : [],
    builder_description: stripSyndicatedText(
      redactEmbeddedRegulatoryIds(
        Array.isArray(raw.builderDescription)
          ? raw.builderDescription
          : raw.builderDescription
          ? [String(raw.builderDescription)]
          : []
      )
    ),
    recent_updates: Array.isArray(raw.recentUpdates) ? raw.recentUpdates : [],
    master_plan:
      raw.masterPlan && (raw.masterPlan.image || raw.masterPlan.content)
        ? { image: raw.masterPlan.image, content: raw.masterPlan.content }
        : null,
    updated_at: raw.updatedAt || null,
  };
}
