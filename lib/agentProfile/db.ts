import type { Collection } from "mongodb";
import { getDb } from "@/lib/mongodb";
import type { AgentProfileDoc } from "./types";

let indexesEnsured = false;

export async function getAgentProfilesCollection(): Promise<Collection<AgentProfileDoc>> {
  const db = await getDb();
  const collection = db.collection<AgentProfileDoc>("agent_profiles");

  if (!indexesEnsured) {
    indexesEnsured = true;
    await collection.createIndex({ userId: 1 }, { unique: true }).catch(() => {});
  }

  return collection;
}
