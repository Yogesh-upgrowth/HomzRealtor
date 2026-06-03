// Project Intelligence ingestion + enrichment pipeline.
//
// Fetches all projects from the live homzbackend API, normalizes them,
// enriches with geo + connectivity (Google) and AI content (OpenAI, once),
// and upserts everything into the app-owned Postgres DB.
//
// Idempotent & resumable: geocoding is skipped when coordinates already exist,
// AI content is skipped when it already exists. Pass FORCE=1 to regenerate.
//
// Staleness: each project stores a hash (content_source_hash) of the core
// source fields the AI content is grounded in. On every run the hash is
// recomputed; if it changed (price, possession, status, builder, etc.), the AI
// content is regenerated automatically — no FORCE needed. Projects that already
// had content before staleness tracking existed get their hash backfilled once
// (as a baseline) without a costly regeneration.
//
// Designed to run unattended on a schedule (e.g. a Replit Scheduled Deployment)
// so new/changed listings on the source API keep their intelligence sections
// fresh. Steady-state runs only do new/changed work, so they finish quickly.
//
// Env: DATABASE_URL, AI_INTEGRATIONS_OPENAI_API_KEY, AI_INTEGRATIONS_OPENAI_BASE_URL,
//      GOOGLE_MAPS_API_KEY
// Flags: FORCE=1, NO_GOOGLE=1, NO_AI=1, LIMIT=<n>, CITY=<base>
//
// Usage:        node scripts/ingest.mjs          (or: npm run ingest)
// Background:   nohup node scripts/ingest.mjs > /tmp/ingest.log 2>&1 &

import pg from "pg";
import {
  normalizeProject,
  normalizeLandmarks,
  contentSignature,
} from "./lib/normalize.mjs";

const { Pool } = pg;

const FORCE = process.env.FORCE === "1";
const NO_GOOGLE = process.env.NO_GOOGLE === "1" || !process.env.GOOGLE_MAPS_API_KEY;
const NO_AI = process.env.NO_AI === "1";
const LIMIT = process.env.LIMIT ? parseInt(process.env.LIMIT, 10) : null;
const CITY_FILTER = process.env.CITY || null;

const CITY_KEYS = ["ggn", "delhi", "faridabad", "gNoida", "noida"];
const CATEGORIES = [
  { name: "Commercial", suffix: "CommercialProjects" },
  { name: "Residential", suffix: "ResidentialProjects" },
];

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function log(...args) {
  console.log(new Date().toISOString(), ...args);
}

async function fetchProjects(base, suffix) {
  const url = `https://homzbackend.vercel.app/api/data?city=${base}${suffix}&page=1&limit=500`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      log(`  ! fetch ${base}${suffix} -> HTTP ${res.status}`);
      return [];
    }
    const data = await res.json();
    return Array.isArray(data?.results) ? data.results : [];
  } catch (e) {
    log(`  ! fetch ${base}${suffix} failed: ${e.message}`);
    return [];
  }
}

async function upsertProject(client, p) {
  const sql = `
    INSERT INTO projects (
      city_key, slug, project_name, builder, property_category, property_type,
      project_status, rera_id, sector, micro_market, city_name, state,
      possession_text, possession_date, price_text, min_price_inr, max_price_inr,
      min_size, max_size, size_unit, land_area, images, about, amenities,
      price_list, source_payload, updated_at
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
      $21,$22,$23,$24,$25,$26, now()
    )
    ON CONFLICT (city_key, slug) DO UPDATE SET
      project_name = EXCLUDED.project_name,
      builder = EXCLUDED.builder,
      property_category = EXCLUDED.property_category,
      property_type = EXCLUDED.property_type,
      project_status = EXCLUDED.project_status,
      rera_id = EXCLUDED.rera_id,
      sector = EXCLUDED.sector,
      micro_market = EXCLUDED.micro_market,
      city_name = EXCLUDED.city_name,
      state = EXCLUDED.state,
      possession_text = EXCLUDED.possession_text,
      possession_date = EXCLUDED.possession_date,
      price_text = EXCLUDED.price_text,
      min_price_inr = EXCLUDED.min_price_inr,
      max_price_inr = EXCLUDED.max_price_inr,
      min_size = EXCLUDED.min_size,
      max_size = EXCLUDED.max_size,
      size_unit = EXCLUDED.size_unit,
      land_area = EXCLUDED.land_area,
      images = EXCLUDED.images,
      about = EXCLUDED.about,
      amenities = EXCLUDED.amenities,
      price_list = EXCLUDED.price_list,
      source_payload = EXCLUDED.source_payload,
      updated_at = now()
    RETURNING id, latitude, content_source_hash`;

  const vals = [
    p.city_key, p.slug, p.project_name, p.builder, p.property_category,
    p.property_type, p.project_status, p.rera_id, p.sector, p.micro_market,
    p.city_name, p.state, p.possession_text, p.possession_date, p.price_text,
    p.min_price_inr, p.max_price_inr, p.min_size, p.max_size, p.size_unit,
    p.land_area, JSON.stringify(p.images), JSON.stringify(p.about),
    JSON.stringify(p.amenities), JSON.stringify(p.price_list),
    JSON.stringify(p.source_payload ?? {}),
  ];
  const { rows } = await client.query(sql, vals);
  return rows[0];
}

async function replaceLandmarks(client, projectId, landmarks) {
  await client.query(`DELETE FROM project_landmarks WHERE project_id = $1`, [
    projectId,
  ]);
  for (const lm of landmarks) {
    await client.query(
      `INSERT INTO project_landmarks
        (project_id, category, name, distance_text, distance_km, sort_order, source)
       VALUES ($1,$2,$3,$4,$5,$6,'homzbackend')`,
      [projectId, lm.category, lm.name, lm.distance_text, lm.distance_km, lm.sort_order],
    );
  }
}

async function replaceConnectivity(client, projectId, rows) {
  await client.query(`DELETE FROM project_connectivity WHERE project_id = $1`, [
    projectId,
  ]);
  for (const c of rows) {
    await client.query(
      `INSERT INTO project_connectivity
        (project_id, label, category, distance_km, travel_time, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [projectId, c.label, c.category, c.distance_km, c.travel_time, c.sort_order],
    );
  }
}

async function upsertContent(client, projectId, kind, body, model) {
  await client.query(
    `INSERT INTO project_content (project_id, kind, body, model, generated_at)
     VALUES ($1,$2,$3,$4, now())
     ON CONFLICT (project_id, kind) DO UPDATE SET
       body = EXCLUDED.body, model = EXCLUDED.model, generated_at = now()`,
    [projectId, kind, JSON.stringify(body), model],
  );
}

async function hasContent(client, projectId) {
  const { rows } = await client.query(
    `SELECT count(*)::int AS n FROM project_content WHERE project_id = $1`,
    [projectId],
  );
  return rows[0].n >= 3;
}

async function processOne(raw, cityKey, category, enrich, ai) {
  const client = await pool.connect();
  try {
    const norm = normalizeProject(raw, cityKey, category);
    norm.source_payload = raw;
    const landmarks = normalizeLandmarks(raw);

    const { id, latitude, content_source_hash: storedHash } =
      await upsertProject(client, norm);
    await replaceLandmarks(client, id, landmarks);

    const newHash = contentSignature(norm);

    let connectivityRows = [];
    if (!NO_GOOGLE && (FORCE || latitude == null)) {
      const addr = [
        norm.project_name,
        norm.sector,
        norm.micro_market,
        norm.city_name,
        norm.state,
        "India",
      ]
        .filter(Boolean)
        .join(", ");
      try {
        const geo = await enrich.geocode(addr);
        if (geo.lat != null) {
          connectivityRows = await enrich.buildConnectivity(cityKey, geo.lat, geo.lng);
          await client.query(
            `UPDATE projects SET latitude=$1, longitude=$2, formatted_address=$3, enriched_at=now() WHERE id=$4`,
            [geo.lat, geo.lng, geo.formatted, id],
          );
          await replaceConnectivity(client, id, connectivityRows);
        } else {
          log(`    geocode miss (${geo.status}) for ${norm.project_name}`);
        }
      } catch (e) {
        log(`    geo error for ${norm.project_name}: ${e.message}`);
      }
    } else if (!NO_GOOGLE && latitude != null) {
      // Already geocoded on a prior run: rebuild connectivity only if it is
      // missing (e.g. a partial failure left lat/lng but no connectivity rows).
      try {
        const { rows: cc } = await client.query(
          `SELECT longitude, (SELECT count(*) FROM project_connectivity WHERE project_id=$1) AS n FROM projects WHERE id=$1`,
          [id],
        );
        const lng = cc[0]?.longitude;
        if (Number(cc[0]?.n || 0) === 0 && lng != null) {
          connectivityRows = await enrich.buildConnectivity(cityKey, latitude, lng);
          await replaceConnectivity(client, id, connectivityRows);
        }
      } catch (e) {
        log(`    connectivity rebuild error for ${norm.project_name}: ${e.message}`);
      }
    }

    if (!NO_AI && ai) {
      const existing = await hasContent(client, id);
      // Decide whether AI content must be (re)generated:
      //  - FORCE          -> always regenerate
      //  - no content yet  -> new project, generate
      //  - stored hash set & differs from current -> source data changed, stale
      // Backfill case: a project that already has content but no stored hash
      // (generated before staleness tracking existed). We adopt the current
      // signature as the baseline WITHOUT a costly regeneration.
      const stale = existing && storedHash != null && storedHash !== newHash;
      const backfillOnly = existing && storedHash == null;

      if (backfillOnly && !FORCE) {
        await client.query(
          `UPDATE projects SET content_source_hash=$1 WHERE id=$2`,
          [newHash, id],
        );
      } else if (FORCE || !existing || stale) {
        if (stale) log(`    source changed -> regenerating AI for ${norm.project_name}`);
        // Gather landmarks + connectivity already stored for grounding.
        const lmGrouped = {};
        for (const lm of landmarks) (lmGrouped[lm.category] ??= []).push(lm);
        if (connectivityRows.length === 0) {
          const { rows } = await client.query(
            `SELECT label, category, distance_km, travel_time FROM project_connectivity WHERE project_id=$1 ORDER BY sort_order`,
            [id],
          );
          connectivityRows = rows;
        }
        try {
          const content = await ai.generateContent(norm, lmGrouped, connectivityRows);
          await upsertContent(client, id, "location_intelligence", { text: content.location_intelligence }, content.model);
          await upsertContent(client, id, "investment_analysis", { text: content.investment_analysis }, content.model);
          await upsertContent(client, id, "faq", content.faq, content.model);
          await client.query(
            `UPDATE projects SET content_source_hash=$1 WHERE id=$2`,
            [newHash, id],
          );
        } catch (e) {
          log(`    AI error for ${norm.project_name}: ${e.message}`);
        }
      }
    }

    return { id, name: norm.project_name };
  } finally {
    client.release();
  }
}

// Simple bounded-concurrency runner.
async function runPool(items, concurrency, worker) {
  let idx = 0;
  let done = 0;
  const total = items.length;
  async function next() {
    while (idx < items.length) {
      const i = idx++;
      try {
        await worker(items[i]);
      } catch (e) {
        log(`  ! item ${i} failed: ${e.message}`);
      }
      done++;
      if (done % 10 === 0 || done === total) log(`  progress ${done}/${total}`);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, next),
  );
}

async function main() {
  log("Ingestion started", {
    FORCE, NO_GOOGLE, NO_AI, LIMIT, CITY_FILTER,
  });

  let enrich = null;
  let ai = null;
  if (!NO_GOOGLE) enrich = await import("./lib/google.mjs");
  if (!NO_AI) ai = await import("./lib/ai.mjs");

  const cities = CITY_FILTER ? [CITY_FILTER] : CITY_KEYS;
  let grand = 0;

  for (const cityKey of cities) {
    for (const cat of CATEGORIES) {
      let results = await fetchProjects(cityKey, cat.suffix);
      if (LIMIT) results = results.slice(0, LIMIT);
      if (results.length === 0) continue;
      log(`City ${cityKey} / ${cat.name}: ${results.length} projects`);
      await runPool(results, 6, (raw) =>
        processOne(raw, cityKey, cat.name, enrich, ai),
      );
      grand += results.length;
    }
  }

  log(`Ingestion complete. Processed ${grand} project records.`);
  await pool.end();
}

main().catch((e) => {
  log("FATAL", e);
  process.exit(1);
});
