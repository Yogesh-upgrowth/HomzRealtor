import type { Collection } from "mongodb";
import { getDb } from "@/lib/mongodb";
import type { PropertyStatusDoc, StatusEventDoc, SyncMetaDoc } from "./types";

// Same lazy index bootstrap pattern as lib/auth/user.ts.
let indexesEnsured = false;

async function ensureIndexes(
  statuses: Collection<PropertyStatusDoc>,
  events: Collection<StatusEventDoc>
): Promise<void> {
  if (indexesEnsured) return;
  indexesEnsured = true;
  await Promise.all([
    statuses.createIndex({ city_key: 1, slug: 1 }, { unique: true }),
    events.createIndex({ city_key: 1, slug: 1, at: -1 }),
  ]).catch(() => {
    // Index creation is best-effort — a race with another instance is fine.
  });
}

export async function getStatusCollections(): Promise<{
  statuses: Collection<PropertyStatusDoc>;
  events: Collection<StatusEventDoc>;
  meta: Collection<SyncMetaDoc>;
}> {
  const db = await getDb();
  const statuses = db.collection<PropertyStatusDoc>("property_status");
  const events = db.collection<StatusEventDoc>("property_status_events");
  const meta = db.collection<SyncMetaDoc>("property_status_sync");
  await ensureIndexes(statuses, events);
  return { statuses, events, meta };
}
