// Read side of status tracking + the demand-driven refresh: viewing a
// property schedules a background re-check of its city when the data is
// stale. Every function here degrades to null/no-op when MongoDB is not
// configured, so pages render normally in environments without it.

import { getStatusCollections } from "./db";
import { syncCityStatus } from "./sync";
import type { PropertyStatusDoc, StatusEventDoc } from "./types";

const STALE_AFTER_MS = 6 * 60 * 60 * 1000; // demand-triggered refresh threshold
const LOCK_TIMEOUT_MS = 10 * 60 * 1000; // a crashed sync frees its lock after this

export type PropertyStatusView = {
  status: PropertyStatusDoc;
  events: StatusEventDoc[];
};

export async function getPropertyStatus(
  cityKey: string,
  slug: string,
  eventLimit = 5
): Promise<PropertyStatusView | null> {
  try {
    const { statuses, events } = await getStatusCollections();
    const status = await statuses.findOne({ city_key: cityKey, slug });
    if (!status) return null;
    const recent = await events
      .find({ city_key: cityKey, slug })
      .sort({ at: -1 })
      .limit(eventLimit)
      .toArray();
    return { status, events: recent };
  } catch {
    return null; // Mongo unreachable/not configured — feature stays dormant
  }
}

// Re-syncs the city in the background if its data is stale. Safe to call on
// every property view: the atomic lock on the meta doc means at most one
// refresh runs per city at a time, and fresh cities return immediately.
export async function refreshCityStatusIfStale(cityKey: string): Promise<void> {
  try {
    const { meta } = await getStatusCollections();
    const now = Date.now();
    const staleBefore = new Date(now - STALE_AFTER_MS);
    const lockExpired = new Date(now - LOCK_TIMEOUT_MS);

    // Claim the refresh atomically: only proceeds when the city is stale (or
    // never synced) AND no live sync currently holds the lock.
    const claimed = await meta.findOneAndUpdate(
      {
        _id: cityKey,
        $and: [
          {
            $or: [
              { last_run_at: null },
              { last_run_at: { $lt: staleBefore } },
            ],
          },
          {
            $or: [
              { refreshing_at: null },
              { refreshing_at: { $lt: lockExpired } },
            ],
          },
        ],
      },
      { $set: { refreshing_at: new Date() } }
    );

    if (claimed) {
      await syncCityStatus(cityKey);
      return;
    }

    // No meta doc yet (city never synced): create it and claim in one step.
    const created = await meta.findOneAndUpdate(
      { _id: cityKey },
      {
        $setOnInsert: {
          last_run_at: null,
          last_ok_at: null,
          refreshing_at: new Date(),
          last_summary: null,
        },
      },
      { upsert: true }
    );
    if (created === null) await syncCityStatus(cityKey);
  } catch {
    // Background freshness is best-effort by design.
  }
}
