import type { Collection } from "mongodb";
import { getDb } from "@/lib/mongodb";
import type { AgentPropertyDoc } from "./types";

// Same lazy index bootstrap pattern as lib/status/db.ts / lib/auth/user.ts.
let indexesEnsured = false;

async function ensureIndexes(properties: Collection<AgentPropertyDoc>): Promise<void> {
  if (indexesEnsured) return;
  indexesEnsured = true;
  await Promise.all([
    properties.createIndex({ ownerId: 1, createdAt: -1 }),
    properties.createIndex({ ownerId: 1, status: 1 }),
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
