import type { Collection } from "mongodb";
import { getDb } from "@/lib/mongodb";
import type { AgentPropertyDoc, PropertyReviewEventDoc } from "./types";

// Same lazy index bootstrap pattern as lib/status/db.ts / lib/auth/user.ts.
let indexesEnsured = false;
let reviewEventIndexesEnsured = false;

async function ensureIndexes(properties: Collection<AgentPropertyDoc>): Promise<void> {
  if (indexesEnsured) return;
  indexesEnsured = true;
  await Promise.all([
    properties.createIndex({ ownerId: 1, createdAt: -1 }),
    properties.createIndex({ ownerId: 1, status: 1 }),
    properties.createIndex({ status: 1, createdAt: -1 }), // admin review queue
  ]).catch(() => {
    // Index creation is best-effort — a race with another instance is fine.
  });
}

export async function getPropertiesCollection(): Promise<Collection<AgentPropertyDoc>> {
  const db = await getDb();
  const collection = db.collection<AgentPropertyDoc>("agent_properties");
  await ensureIndexes(collection);
  return collection;
}

export async function getReviewEventsCollection(): Promise<Collection<PropertyReviewEventDoc>> {
  const db = await getDb();
  const collection = db.collection<PropertyReviewEventDoc>("agent_property_review_events");
  if (!reviewEventIndexesEnsured) {
    reviewEventIndexesEnsured = true;
    await collection.createIndex({ propertyId: 1, at: -1 }).catch(() => {});
  }
  return collection;
}
