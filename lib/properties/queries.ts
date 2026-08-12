import { ObjectId } from "mongodb";
import { del } from "@vercel/blob";
import { getPropertiesCollection, getReviewEventsCollection } from "./db";
import type { AgentPropertyDoc, PropertyReviewEventDoc, PropertyStatus } from "./types";
import type { CreateAgentPropertyInput, ReviewActionInput } from "./validation";

// All Mongo timestamps/ids stay native (Date/ObjectId) here — conversion to
// JSON-safe DTOs happens only in serialize.ts, right before a response is
// sent, matching the lib/status / lib/auth convention.

const EMPTY_MODERATION = { reviewedBy: null, reviewedAt: null, rejectionReason: null };

export async function createProperty(
  ownerId: string,
  input: CreateAgentPropertyInput
): Promise<AgentPropertyDoc> {
  const properties = await getPropertiesCollection();
  const now = new Date();
  const doc: AgentPropertyDoc = {
    ownerId: new ObjectId(ownerId),
    status: "pending",
    moderation: EMPTY_MODERATION,
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

  const existing = await properties.findOne({ _id: new ObjectId(id), ownerId: new ObjectId(ownerId) });
  if (!existing) return null;

  const set: Partial<AgentPropertyDoc> = {
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
  };

  // Editing a rejected listing resends it for review — clear the stale
  // rejection reason since the review_events history keeps the record.
  if (existing.status === "rejected") {
    set.status = "pending";
    set.moderation = EMPTY_MODERATION;
  }

  return properties.findOneAndUpdate(
    { _id: new ObjectId(id), ownerId: new ObjectId(ownerId) },
    { $set: set },
    { returnDocument: "after" }
  );
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

// ---- Admin-scoped queries (not ownership-restricted) ----

export async function listPropertiesForAdmin(filters: {
  status?: PropertyStatus;
  city?: string;
  ownerId?: string;
}): Promise<AgentPropertyDoc[]> {
  const properties = await getPropertiesCollection();
  const filter: Record<string, unknown> = {};
  if (filters.status) filter.status = filters.status;
  if (filters.city) filter["basicInfo.city"] = filters.city;
  if (filters.ownerId && ObjectId.isValid(filters.ownerId)) {
    filter.ownerId = new ObjectId(filters.ownerId);
  }
  return properties.find(filter).sort({ createdAt: -1 }).toArray();
}

export async function getPropertyById(id: string): Promise<AgentPropertyDoc | null> {
  if (!ObjectId.isValid(id)) return null;
  const properties = await getPropertiesCollection();
  return properties.findOne({ _id: new ObjectId(id) });
}

// Only valid from "pending" — approving/rejecting an already-decided listing
// is not allowed through this path (resubmission after rejection goes
// through updateProperty, which puts it back to "pending" first).
export async function reviewProperty(
  id: string,
  input: ReviewActionInput,
  adminId: string
): Promise<AgentPropertyDoc | null> {
  if (!ObjectId.isValid(id)) return null;
  const properties = await getPropertiesCollection();
  const now = new Date();
  const newStatus: PropertyStatus = input.action === "approve" ? "active" : "rejected";
  const reason = input.action === "reject" ? input.reason ?? null : null;

  const result = await properties.findOneAndUpdate(
    { _id: new ObjectId(id), status: "pending" },
    {
      $set: {
        status: newStatus,
        moderation: { reviewedBy: new ObjectId(adminId), reviewedAt: now, rejectionReason: reason },
        updatedAt: now,
      },
    },
    { returnDocument: "after" }
  );

  if (result) {
    const events = await getReviewEventsCollection();
    await events.insertOne({
      propertyId: result._id as ObjectId,
      adminId: new ObjectId(adminId),
      action: input.action === "approve" ? "approved" : "rejected",
      reason,
      at: now,
    });
  }

  return result;
}

// Takes down any listing regardless of current status — soft (archived),
// not a hard delete, so it stays reversible/auditable.
export async function takedownProperty(
  id: string,
  reason: string,
  adminId: string
): Promise<AgentPropertyDoc | null> {
  if (!ObjectId.isValid(id)) return null;
  const properties = await getPropertiesCollection();
  const now = new Date();

  const result = await properties.findOneAndUpdate(
    { _id: new ObjectId(id) },
    {
      $set: {
        status: "archived",
        moderation: { reviewedBy: new ObjectId(adminId), reviewedAt: now, rejectionReason: null },
        updatedAt: now,
      },
    },
    { returnDocument: "after" }
  );

  if (result) {
    const events = await getReviewEventsCollection();
    await events.insertOne({
      propertyId: result._id as ObjectId,
      adminId: new ObjectId(adminId),
      action: "removed",
      reason,
      at: now,
    });
  }

  return result;
}

export async function getReviewEventsForProperty(propertyId: string): Promise<PropertyReviewEventDoc[]> {
  if (!ObjectId.isValid(propertyId)) return [];
  const events = await getReviewEventsCollection();
  return events.find({ propertyId: new ObjectId(propertyId) }).sort({ at: -1 }).toArray();
}
