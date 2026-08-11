import { ObjectId } from "mongodb";
import { del } from "@vercel/blob";
import { getPropertiesCollection } from "./db";
import type { AgentPropertyDoc, PropertyStatus } from "./types";
import type { CreateAgentPropertyInput } from "./validation";

// All Mongo timestamps/ids stay native (Date/ObjectId) here — conversion to
// JSON-safe DTOs happens only in serialize.ts, right before a response is
// sent, matching the lib/status / lib/auth convention.

export async function createProperty(
  ownerId: string,
  input: CreateAgentPropertyInput
): Promise<AgentPropertyDoc> {
  const properties = await getPropertiesCollection();
  const now = new Date();
  const doc: AgentPropertyDoc = {
    ownerId: new ObjectId(ownerId),
    status: "active",
    createdAt: now,
    updatedAt: now,
    basicInfo: input.basicInfo,
    configuration: {
      ...input.configuration,
      availableFrom: {
        type: input.configuration.availableFrom.type,
        date: input.configuration.availableFrom.date
          ? new Date(input.configuration.availableFrom.date)
          : null,
      },
    },
    media: input.media,
    detailedConfig: input.detailedConfig,
    description: input.description,
  };
  const { insertedId } = await properties.insertOne(doc);
  return { ...doc, _id: insertedId };
}

export async function listPropertiesForOwner(
  ownerId: string,
  status?: PropertyStatus
): Promise<AgentPropertyDoc[]> {
  const properties = await getPropertiesCollection();
  const filter: Record<string, unknown> = { ownerId: new ObjectId(ownerId) };
  if (status) filter.status = status;
  return properties.find(filter).sort({ createdAt: -1 }).toArray();
}

export async function getPropertyForOwner(
  ownerId: string,
  id: string
): Promise<AgentPropertyDoc | null> {
  if (!ObjectId.isValid(id)) return null;
  const properties = await getPropertiesCollection();
  return properties.findOne({ _id: new ObjectId(id), ownerId: new ObjectId(ownerId) });
}

export async function updateProperty(
  ownerId: string,
  id: string,
  input: CreateAgentPropertyInput
): Promise<AgentPropertyDoc | null> {
  if (!ObjectId.isValid(id)) return null;
  const properties = await getPropertiesCollection();
  const result = await properties.findOneAndUpdate(
    { _id: new ObjectId(id), ownerId: new ObjectId(ownerId) },
    {
      $set: {
        basicInfo: input.basicInfo,
        configuration: {
          ...input.configuration,
          availableFrom: {
            type: input.configuration.availableFrom.type,
            date: input.configuration.availableFrom.date
              ? new Date(input.configuration.availableFrom.date)
              : null,
          },
        },
        media: input.media,
        detailedConfig: input.detailedConfig,
        description: input.description,
        updatedAt: new Date(),
      },
    },
    { returnDocument: "after" }
  );
  return result;
}

export async function setPropertyStatus(
  ownerId: string,
  id: string,
  status: PropertyStatus
): Promise<AgentPropertyDoc | null> {
  if (!ObjectId.isValid(id)) return null;
  const properties = await getPropertiesCollection();
  return properties.findOneAndUpdate(
    { _id: new ObjectId(id), ownerId: new ObjectId(ownerId) },
    { $set: { status, updatedAt: new Date() } },
    { returnDocument: "after" }
  );
}

export async function deleteProperty(ownerId: string, id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const properties = await getPropertiesCollection();
  const doc = await properties.findOne({ _id: new ObjectId(id), ownerId: new ObjectId(ownerId) });
  if (!doc) return false;

  const blobUrls = [...doc.media.images.map((i) => i.url), doc.media.video?.url].filter(
    (u): u is string => Boolean(u)
  );
  if (blobUrls.length > 0) {
    // Best-effort — a Blob API hiccup should never block deleting the record.
    await del(blobUrls).catch(() => {});
  }

  const result = await properties.deleteOne({ _id: doc._id });
  return result.deletedCount === 1;
}
