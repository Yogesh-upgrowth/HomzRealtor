import type { CreateAgentPropertyInput } from "@/lib/properties/validation";
import type { ListPropertyFormState } from "./types";

// Converts the wizard's client-side (string-heavy, form-friendly) state into
// the exact shape the backend's createAgentPropertySchema expects. This is
// the one and only place that shape conversion happens.
export function toApiPayload(state: ListPropertyFormState): CreateAgentPropertyInput {
  const { basicInfo, configuration, media, detailedConfig, description } = state;

  const coverImage = media.images.find((i) => i.isCover && i.status === "done" && i.url);
  const doneImages = media.images.filter((i) => i.status === "done" && i.url);
  const doneVideo = media.videos.find((v) => v.status === "done" && v.url);

  return {
    basicInfo: {
      listingType: basicInfo.listingType!,
      buildingType: basicInfo.buildingType ?? "Residential",
      propertyType: basicInfo.propertyType!,
      city: basicInfo.city.trim(),
      locality: basicInfo.locality.trim(),
      society: basicInfo.society.trim() || null,
      coordinates: null,
      bhk: basicInfo.bhk!,
      additionalSpaces: basicInfo.additionalSpaces,
      suitedFor: basicInfo.suitedFor!,
      areaDetails: basicInfo.areaDetails
        .filter((a) => Number(a.areaSize) > 0)
        .map((a) => ({
          areaSize: Number(a.areaSize),
          areaType: a.areaType,
          isDisplay: a.isDisplay,
        })),
      price: { amount: Number(basicInfo.priceAmount), unit: basicInfo.priceUnit },
      maintenance: basicInfo.maintenanceAmount
        ? {
            amount: Number(basicInfo.maintenanceAmount),
            unit: basicInfo.maintenanceUnit,
            includedInPrice: basicInfo.maintenanceIncludedInPrice,
          }
        : null,
      securityDeposit: basicInfo.securityDeposit,
    },
    configuration: {
      availableFrom: {
        type: configuration.availableFromType ?? "Immediately",
        date:
          configuration.availableFromType === "Later" && configuration.availableFromDate
            ? new Date(configuration.availableFromDate).toISOString()
            : null,
      },
      ageOfProperty: configuration.ageOfProperty ?? "0-1",
      bathrooms: configuration.bathrooms ?? "1",
      coveredParking: configuration.coveredParking ?? "N/A",
      openParking: configuration.openParking ?? "N/A",
      balcony: configuration.balcony,
    },
    media: {
      images: doneImages.map((img) => ({
        url: img.url!,
        tag: img.tag || "Exterior View",
        isCover: coverImage ? img.id === coverImage.id : img.id === doneImages[0]?.id,
      })),
      video: doneVideo ? { url: doneVideo.url! } : null,
      flooring: media.flooring.trim() || null,
      towerBlock: media.towerBlock.trim() || null,
      unitNo: media.unitNo.trim() ? { value: media.unitNo.trim(), keepPrivate: media.unitNoPrivate } : null,
      highlights: media.highlights,
    },
    detailedConfig: {
      furnishingStatus: detailedConfig.furnishingStatus!,
      powerBackup: detailedConfig.powerBackup ?? "No Back-up",
      facing: detailedConfig.facing.trim() || null,
      view: detailedConfig.view.trim() || null,
      floorNumber: detailedConfig.floorNumber ? Number(detailedConfig.floorNumber) : null,
      totalFloorCount: detailedConfig.totalFloorCount ? Number(detailedConfig.totalFloorCount) : null,
      connectingRoadWidth: detailedConfig.connectingRoadWidth
        ? { value: Number(detailedConfig.connectingRoadWidth), unit: detailedConfig.connectingRoadWidthUnit }
        : null,
      amenities: detailedConfig.amenities,
    },
    description: {
      oneLineDescription: description.oneLineDescription.trim(),
      propertyDescription: description.propertyDescription.trim(),
    },
  };
}
