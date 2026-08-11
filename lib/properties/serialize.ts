import type { AgentPropertyDetail, AgentPropertyDoc, AgentPropertyListItem } from "./types";

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
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export function toPropertyDetail(doc: AgentPropertyDoc): AgentPropertyDetail {
  if (!doc._id) {
    throw new Error("toPropertyDetail requires a document with an _id");
  }
  return {
    id: doc._id.toString(),
    status: doc.status,
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
