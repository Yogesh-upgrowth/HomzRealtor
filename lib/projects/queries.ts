import { query } from "@/lib/db";

export type ProjectRow = {
  id: number;
  city_key: string;
  slug: string;
  project_name: string;
  builder: string | null;
  property_category: string | null;
  property_type: string | null;
  project_status: string | null;
  rera_id: string | null;
  sector: string | null;
  micro_market: string | null;
  city_name: string | null;
  state: string | null;
  possession_text: string | null;
  possession_date: string | null;
  price_text: string | null;
  min_price_inr: string | null;
  max_price_inr: string | null;
  min_size: string | null;
  max_size: string | null;
  size_unit: string | null;
  land_area: string | null;
  latitude: number | null;
  longitude: number | null;
  formatted_address: string | null;
  images: string[] | null;
  about: string[] | null;
  amenities: any[] | null;
  price_list: any[] | null;
};

export type Landmark = {
  category: string;
  name: string;
  distance_text: string | null;
  distance_km: number | null;
  travel_time: string | null;
};

export type Connectivity = {
  label: string;
  category: string | null;
  distance_km: number | null;
  travel_time: string | null;
};

export type FaqItem = { q: string; a: string };

export type ProjectIntelligence = {
  project: ProjectRow;
  landmarks: Record<string, Landmark[]>;
  connectivity: Connectivity[];
  content: {
    location_intelligence?: string;
    investment_analysis?: string;
    faq?: FaqItem[];
  };
};

export async function getProjectIntelligence(
  cityKey: string,
  slug: string,
): Promise<ProjectIntelligence | null> {
  const projects = await query<ProjectRow>(
    `SELECT * FROM projects WHERE city_key = $1 AND slug = $2 LIMIT 1`,
    [cityKey, slug],
  );
  const project = projects[0];
  if (!project) return null;

  const [landmarkRows, connectivity, contentRows] = await Promise.all([
    query<Landmark & { sort_order: number }>(
      `SELECT category, name, distance_text, distance_km, travel_time
       FROM project_landmarks WHERE project_id = $1
       ORDER BY category, sort_order, distance_km NULLS LAST`,
      [project.id],
    ),
    query<Connectivity>(
      `SELECT label, category, distance_km, travel_time
       FROM project_connectivity WHERE project_id = $1
       ORDER BY sort_order, distance_km NULLS LAST`,
      [project.id],
    ),
    query<{ kind: string; body: any }>(
      `SELECT kind, body FROM project_content WHERE project_id = $1`,
      [project.id],
    ),
  ]);

  const landmarks: Record<string, Landmark[]> = {};
  for (const row of landmarkRows) {
    (landmarks[row.category] ??= []).push(row);
  }

  const content: ProjectIntelligence["content"] = {};
  for (const row of contentRows) {
    if (row.kind === "faq") {
      content.faq = Array.isArray(row.body) ? row.body : row.body?.faq;
    } else if (row.kind === "location_intelligence") {
      content.location_intelligence =
        typeof row.body === "string" ? row.body : row.body?.text;
    } else if (row.kind === "investment_analysis") {
      content.investment_analysis =
        typeof row.body === "string" ? row.body : row.body?.text;
    }
  }

  return { project, landmarks, connectivity, content };
}
