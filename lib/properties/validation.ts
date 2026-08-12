import { z } from "zod";

const listingTypeEnum = z.enum(["Sale", "Rent"]);
const buildingTypeEnum = z.enum(["Residential", "Commercial"]);
const propertyTypeEnum = z.enum([
  "Apartment",
  "Villa",
  "Plot",
  "Builder Floor",
  "Penthouse",
  "Independent House",
  "PG",
]);
const bhkEnum = z.enum([
  "Studio",
  "1RK",
  "1BHK",
  "1.5BHK",
  "2BHK",
  "2.5BHK",
  "3BHK",
  "3.5BHK",
  "4BHK",
  "5BHK",
  "6BHK",
  "6+BHK",
]);
const additionalSpaceEnum = z.enum([
  "Power Room",
  "Servant Room",
  "Study Room",
  "Extra Room",
  "Basement",
  "Store Room",
]);
const suitedForEnum = z.enum(["Students", "Working Professionals", "Any"]);
const securityDepositEnum = z.enum(["Zero", "One Month", "Two Month", "Other"]);
const rangeChipEnum = z.enum(["N/A", "1", "2", "3", "4", "5", "6", "6+"]);
const balconyTypeEnum = z.enum(["Connected", "Individual", "Room-attached"]);
const propertyHighlightEnum = z.enum([
  "Pet Friendly",
  "Gated Community",
  "Smart Home",
  "Premium Location",
  "Corner Unit",
  "Private Garden",
  "Low Density Project",
  "Quiet/Low Traffic Area",
  "Wheelchair Accessible",
  "Never Occupied",
]);
const furnishingStatusEnum = z.enum(["Furnished", "Semi-Furnished", "Unfurnished"]);
const powerBackupEnum = z.enum(["No Back-up", "Available"]);

const areaDetailSchema = z.object({
  areaSize: z.number().positive("Enter a valid area"),
  areaType: z.string().trim().min(1, "Select an area type"),
  isDisplay: z.boolean(),
});

export const basicInfoSchema = z
  .object({
    listingType: listingTypeEnum,
    buildingType: buildingTypeEnum,
    propertyType: propertyTypeEnum,
    city: z.string().trim().min(1, "City is required"),
    locality: z.string().trim().min(1, "Locality/Society is required"),
    society: z.string().trim().nullable(),
    coordinates: z.object({ lat: z.number(), lng: z.number() }).nullable(),
    bhk: bhkEnum,
    additionalSpaces: z.array(additionalSpaceEnum),
    suitedFor: suitedForEnum,
    areaDetails: z.array(areaDetailSchema).min(1, "Add at least one area detail"),
    price: z.object({
      amount: z.number().positive("Enter a valid price"),
      unit: z.string().trim().min(1, "Select a price unit"),
    }),
    maintenance: z
      .object({
        amount: z.number().nonnegative(),
        unit: z.string().trim().min(1),
        includedInPrice: z.boolean(),
      })
      .nullable(),
    securityDeposit: securityDepositEnum.nullable(),
  })
  .superRefine((v, ctx) => {
    if (v.listingType === "Rent" && !v.securityDeposit) {
      ctx.addIssue({
        code: "custom",
        path: ["securityDeposit"],
        message: "Security deposit is required for rentals",
      });
    }
  });

export const configurationSchema = z.object({
  availableFrom: z.object({
    type: z.enum(["Immediately", "Later"]),
    date: z.string().nullable(),
  }),
  ageOfProperty: z.enum(["0-1", "2-4", "5-7", "8-10", "10+"]),
  bathrooms: rangeChipEnum,
  coveredParking: rangeChipEnum,
  openParking: rangeChipEnum,
  balcony: z.array(balconyTypeEnum),
});

export const mediaSchema = z
  .object({
    images: z
      .array(
        z.object({
          url: z.string().url(),
          tag: z.string().trim().min(1).max(40),
          isCover: z.boolean(),
        })
      )
      .min(1, "At least one photo is required"),
    video: z.object({ url: z.string().url() }).nullable(),
    flooring: z.string().trim().nullable(),
    towerBlock: z.string().trim().nullable(),
    unitNo: z.object({ value: z.string().trim(), keepPrivate: z.boolean() }).nullable(),
    highlights: z.array(propertyHighlightEnum),
  })
  .superRefine((v, ctx) => {
    const covers = v.images.filter((i) => i.isCover).length;
    if (covers !== 1) {
      ctx.addIssue({
        code: "custom",
        path: ["images"],
        message: "Exactly one image must be marked as cover",
      });
    }
  });

export const detailedConfigSchema = z.object({
  furnishingStatus: furnishingStatusEnum,
  powerBackup: powerBackupEnum,
  facing: z.string().trim().nullable(),
  view: z.string().trim().nullable(),
  floorNumber: z.number().int().nullable(),
  totalFloorCount: z.number().int().nullable(),
  connectingRoadWidth: z
    .object({ value: z.number().positive(), unit: z.enum(["Feet", "Meter"]) })
    .nullable(),
  // Keys are amenity category names — kept as a generic string record (not
  // the strict amenityCategoryEnum) so the object type is naturally partial;
  // the actual category set is enforced by the wizard's own UI options.
  amenities: z.record(z.string(), z.array(z.string())),
});

export const descriptionSchema = z.object({
  oneLineDescription: z
    .string()
    .trim()
    .min(1, "One line description is required")
    .refine((s) => s.split(/\s+/).filter(Boolean).length <= 20, "Max 20 words"),
  propertyDescription: z
    .string()
    .trim()
    .min(30, "Please write a fuller description (min 30 characters)"),
});

export const createAgentPropertySchema = z.object({
  basicInfo: basicInfoSchema,
  configuration: configurationSchema,
  media: mediaSchema,
  detailedConfig: detailedConfigSchema,
  description: descriptionSchema,
});

export type CreateAgentPropertyInput = z.infer<typeof createAgentPropertySchema>;

export const updatePropertyStatusSchema = z.object({
  status: z.enum(["active", "inactive", "archived"]),
});

// Admin review of a pending/rejected listing.
export const reviewActionSchema = z
  .object({
    action: z.enum(["approve", "reject"]),
    reason: z.string().trim().min(1).max(1000).optional(),
  })
  .superRefine((v, ctx) => {
    if (v.action === "reject" && !v.reason) {
      ctx.addIssue({
        code: "custom",
        path: ["reason"],
        message: "A reason is required to reject a listing",
      });
    }
  });

export type ReviewActionInput = z.infer<typeof reviewActionSchema>;

// Admin taking down an already-live listing.
export const takedownSchema = z.object({
  reason: z.string().trim().min(1, "A reason is required to take down a listing").max(1000),
});
