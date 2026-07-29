// Status sync engine — diffs the homzbackend feed against stored property
// status docs and records every change as an event (listed / delisted /
// status_change / price_change). Server-only: runs from the cron route and
// from demand-triggered refreshes (lib/status/queries.ts).

import type { AnyBulkWriteOperation } from "mongodb";
import {
  CITY_KEYS,
  categorySegment,
  fetchProjects,
  type RawHomzProject,
} from "@/lib/scraping/homzbackend";
import { slugify, extractPriceRange } from "@/lib/intelligence/normalize";
import { deriveStatusFromText } from "@/lib/intelligence/view-model";
import { getStatusCollections } from "./db";
import type {
  CitySyncSummary,
  PropertyStatusDoc,
  StatusEventDoc,
} from "./types";

type Candidate = {
  slug: string;
  project_title: string;
  status: string;
  possession_text: string | null;
  price_text: string | null;
  min_price_inr: number | null;
  max_price_inr: number | null;
};

function toCandidate(raw: RawHomzProject): Candidate | null {
  const title = typeof raw.projectTitle === "string" ? raw.projectTitle.trim() : "";
  if (!title) return null;
  const slug = slugify(title);
  if (!slug) return null;
  const price = extractPriceRange(raw.price, raw.priceList);
  return {
    slug,
    project_title: title,
    status: deriveStatusFromText(raw.projectStatus, raw.possession),
    possession_text: raw.possession?.trim() || null,
    price_text: raw.price?.trim() || null,
    min_price_inr: price.min,
    max_price_inr: price.max,
  };
}

function priceChanged(a: Candidate, b: PropertyStatusDoc): boolean {
  return (
    (a.min_price_inr ?? null) !== (b.min_price_inr ?? null) ||
    (a.max_price_inr ?? null) !== (b.max_price_inr ?? null)
  );
}

// Never mass-delist on a bad feed day: only mark properties delisted when the
// feed came back at a plausible size (≥ half of what we currently track).
const DELIST_SAFETY_RATIO = 0.5;

export async function syncCityStatus(cityKey: string): Promise<CitySyncSummary> {
  const started = Date.now();
  const summary: CitySyncSummary = {
    city_key: cityKey,
    fetched: 0,
    added: 0,
    status_changes: 0,
    price_changes: 0,
    delisted: 0,
    skipped: false,
    duration_ms: 0,
  };

  const [commercial, residential] = await Promise.all([
    fetchProjects(categorySegment(cityKey, "Commercial")).catch(() => []),
    fetchProjects(categorySegment(cityKey, "Residential")).catch(() => []),
  ]);

  // Dedupe by slug — first occurrence wins, matching how project URLs resolve.
  const candidates = new Map<string, Candidate>();
  for (const raw of [...commercial, ...residential]) {
    const c = toCandidate(raw);
    if (c && !candidates.has(c.slug)) candidates.set(c.slug, c);
  }
  summary.fetched = candidates.size;

  const { statuses, events, meta } = await getStatusCollections();
  const now = new Date();

  if (candidates.size === 0) {
    // Feed outage/empty — record the attempt, change nothing.
    summary.skipped = true;
    summary.duration_ms = Date.now() - started;
    await meta.updateOne(
      { _id: cityKey },
      { $set: { last_run_at: now, last_summary: summary } },
      { upsert: true }
    );
    return summary;
  }

  const existing = await statuses.find({ city_key: cityKey }).toArray();
  const existingBySlug = new Map(existing.map((d) => [d.slug, d]));

  const ops: AnyBulkWriteOperation<PropertyStatusDoc>[] = [];
  const newEvents: StatusEventDoc[] = [];

  for (const c of candidates.values()) {
    const prev = existingBySlug.get(c.slug);

    if (!prev) {
      summary.added += 1;
      ops.push({
        insertOne: {
          document: {
            city_key: cityKey,
            slug: c.slug,
            project_title: c.project_title,
            status: c.status,
            possession_text: c.possession_text,
            price_text: c.price_text,
            min_price_inr: c.min_price_inr,
            max_price_inr: c.max_price_inr,
            listed: true,
            source: "feed",
            first_seen_at: now,
            last_seen_at: now,
            last_checked_at: now,
            last_changed_at: null,
          },
        },
      });
      newEvents.push({
        city_key: cityKey,
        slug: c.slug,
        at: now,
        type: "listed",
        from: null,
        to: c.status,
        source: "feed",
      });
      continue;
    }

    const statusChange = prev.status !== c.status;
    const priceChange = priceChanged(c, prev);
    const relisted = !prev.listed;

    if (statusChange) {
      summary.status_changes += 1;
      newEvents.push({
        city_key: cityKey,
        slug: c.slug,
        at: now,
        type: "status_change",
        from: prev.status,
        to: c.status,
        source: "feed",
      });
    }
    if (priceChange) {
      summary.price_changes += 1;
      newEvents.push({
        city_key: cityKey,
        slug: c.slug,
        at: now,
        type: "price_change",
        from: prev.price_text,
        to: c.price_text,
        source: "feed",
      });
    }
    if (relisted) {
      newEvents.push({
        city_key: cityKey,
        slug: c.slug,
        at: now,
        type: "listed",
        from: null,
        to: c.status,
        source: "feed",
      });
    }

    const changed = statusChange || priceChange || relisted;
    ops.push({
      updateOne: {
        filter: { city_key: cityKey, slug: c.slug },
        update: {
          $set: {
            project_title: c.project_title,
            status: c.status,
            possession_text: c.possession_text,
            price_text: c.price_text,
            min_price_inr: c.min_price_inr,
            max_price_inr: c.max_price_inr,
            listed: true,
            last_seen_at: now,
            last_checked_at: now,
            ...(changed ? { last_changed_at: now } : {}),
          },
        },
      },
    });
  }

  // Delist tracked properties that vanished from a healthy-looking feed.
  const listedCount = existing.filter((d) => d.listed).length;
  const feedLooksHealthy =
    candidates.size >= Math.ceil(listedCount * DELIST_SAFETY_RATIO);
  if (feedLooksHealthy) {
    for (const prev of existing) {
      if (!prev.listed || candidates.has(prev.slug)) continue;
      summary.delisted += 1;
      ops.push({
        updateOne: {
          filter: { city_key: cityKey, slug: prev.slug },
          update: {
            $set: { listed: false, last_checked_at: now, last_changed_at: now },
          },
        },
      });
      newEvents.push({
        city_key: cityKey,
        slug: prev.slug,
        at: now,
        type: "delisted",
        from: prev.status,
        to: null,
        source: "feed",
      });
    }
  }

  if (ops.length > 0) await statuses.bulkWrite(ops, { ordered: false });
  if (newEvents.length > 0) await events.insertMany(newEvents, { ordered: false });

  summary.duration_ms = Date.now() - started;
  await meta.updateOne(
    { _id: cityKey },
    {
      $set: {
        last_run_at: now,
        last_ok_at: now,
        refreshing_at: null,
        last_summary: summary,
      },
    },
    { upsert: true }
  );
  return summary;
}

export async function syncAllCities(): Promise<CitySyncSummary[]> {
  return Promise.all(CITY_KEYS.map((c) => syncCityStatus(c)));
}
