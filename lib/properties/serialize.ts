import type {
  AdminPropertyListItem,
  AgentPropertyDetail,
  AgentPropertyDoc,
  AgentPropertyListItem,
  PropertyReviewEventDoc,
  PropertyReviewEventView,
} from "./types";

export function toPropertyListItem(doc: AgentPropertyDoc): AgentPropertyListItem {
  if (!doc._id) {
    throw new Error("toPropertyListItem requires a document with an _id");
  }
  const cover = doc.media.images.find((img) => img.isCover) ?? doc.media.images[0] ?? null;
  return {
    id: doc._id.toString(),
    status: doc.status,
    listingType: doc.basicInfo.listingType,
    propertyType: doc.basicInfo.propertyType,
    city: doc.basicInfo.city,
    locality: doc.basicInfo.locality,
    bhk: doc.basicInfo.bhk,
    price: doc.basicInfo.price,
    coverImageUrl: cover?.url ?? null,
    rejectionReason: doc.status === "rejected" ? doc.moderation.rejectionReason : null,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export function toAdminPropertyListItem(
  doc: AgentPropertyDoc,
  owner: { name: string; email: string }
): AdminPropertyListItem {
  return {
    ...toPropertyListItem(doc),
    ownerId: doc.ownerId.toString(),
    ownerName: owner.name,
    ownerEmail: owner.email,
  };
}

export function toPropertyDetail(doc: AgentPropertyDoc): AgentPropertyDetail {
  if (!doc._id) {
    throw new Error("toPropertyDetail requires a document with an _id");
  }
  return {
    id: doc._id.toString(),
    ownerId: doc.ownerId.toString(),
    status: doc.status,
    moderation: {
      reviewedBy: doc.moderation.reviewedBy?.toString() ?? null,
      reviewedAt: doc.moderation.reviewedAt ? doc.moderation.reviewedAt.toISOString() : null,
      rejectionReason: doc.moderation.rejectionReason,
    },
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
    basicInfo: doc.basicInfo,
    configuration: {
      ...doc.configuration,
      availableFrom: {
        type: doc.configuration.availableFrom.type,
        date: doc.configuration.availableFrom.date
          ? doc.configuration.availableFrom.date.toISOString()
          : null,
      },
    },
    media: doc.media,
    detailedConfig: doc.detailedConfig,
    description: doc.description,
  };
}

export function toReviewEventView(doc: PropertyReviewEventDoc, adminName: string): PropertyReviewEventView {
  if (!doc._id) {
    throw new Error("toReviewEventView requires a document with an _id");
  }
  return {
    id: doc._id.toString(),
    adminId: doc.adminId.toString(),
    adminName,
    action: doc.action,
    reason: doc.reason,
    at: doc.at.toISOString(),
  };
}
