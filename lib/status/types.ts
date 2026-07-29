import type { ObjectId } from "mongodb";

// Live status tracking for properties. Documents are written by the sync
// engine (lib/status/sync.ts) which diffs the homzbackend feed, and are
// designed to accept other writers later (agent dashboard, portal watchers)
// via the `source` field — a status like "Rented" or "Vacant" from an agent
// uses the same shape.

export type StatusSource = "feed" | "agent" | "portal";

export type PropertyStatusDoc = {
  _id?: ObjectId;
  city_key: string; // raw API city key, e.g. "ggn"
  slug: string; // canonical URL slug — matches slugify(projectTitle)
  project_title: string;
  status: string; // canonical label, e.g. "Under Construction", "Rented"
  possession_text: string | null;
  price_text: string | null;
  min_price_inr: number | null;
  max_price_inr: number | null;
  listed: boolean; // still present in the source feed?
  source: StatusSource;
  first_seen_at: Date;
  last_seen_at: Date; // last time the feed contained this property
  last_checked_at: Date; // last time we verified against the source
  last_changed_at: Date | null; // last time status/price actually changed
};

export type StatusEventType =
  | "listed"
  | "delisted"
  | "status_change"
  | "price_change";

export type StatusEventDoc = {
  _id?: ObjectId;
  city_key: string;
  slug: string;
  at: Date;
  type: StatusEventType;
  from: string | null;
  to: string | null;
  source: StatusSource;
};

// One doc per city — sync bookkeeping + the lock that stops concurrent
// demand-triggered refreshes from stampeding.
export type SyncMetaDoc = {
  _id: string; // city_key
  last_run_at: Date | null;
  last_ok_at: Date | null;
  refreshing_at: Date | null; // set while a sync holds the lock
  last_summary: CitySyncSummary | null;
};

export type CitySyncSummary = {
  city_key: string;
  fetched: number;
  added: number;
  status_changes: number;
  price_changes: number;
  delisted: number;
  skipped: boolean; // feed empty/partial — nothing written
  duration_ms: number;
};
