import type {
  ListingType,
  BuildingType,
  PropertyType,
  BHK,
  AdditionalSpace,
  SuitedFor,
  SecurityDeposit,
  RangeChip,
  BalconyType,
  PropertyHighlight,
  FurnishingStatus,
  PowerBackup,
  AmenityCategory,
} from "@/lib/properties/types";
import type { UploadedMedia } from "@/components/Form/ImageUploader";

export type AreaDetailField = { areaSize: string; areaType: string; isDisplay: boolean };

export type ListPropertyFormState = {
  basicInfo: {
    listingType: ListingType | null;
    buildingType: BuildingType | null;
    propertyType: PropertyType | null;
    city: string;
    locality: string;
    society: string;
    bhk: BHK | null;
    additionalSpaces: AdditionalSpace[];
    suitedFor: SuitedFor | null;
    areaDetails: AreaDetailField[];
    priceAmount: string;
    priceUnit: string;
    maintenanceAmount: string;
    maintenanceUnit: string;
    maintenanceIncludedInPrice: boolean;
    securityDeposit: SecurityDeposit | null;
  };
  configuration: {
    availableFromType: "Immediately" | "Later" | null;
    availableFromDate: string;
    ageOfProperty: "0-1" | "2-4" | "5-7" | "8-10" | "10+" | null;
    bathrooms: RangeChip | null;
    coveredParking: RangeChip | null;
    openParking: RangeChip | null;
    balcony: BalconyType[];
  };
  media: {
    images: UploadedMedia[];
    videos: UploadedMedia[];
    flooring: string;
    towerBlock: string;
    unitNo: string;
    unitNoPrivate: boolean;
    highlights: PropertyHighlight[];
  };
  detailedConfig: {
    furnishingStatus: FurnishingStatus | null;
    powerBackup: PowerBackup | null;
    facing: string;
    view: string;
    floorNumber: string;
    totalFloorCount: string;
    connectingRoadWidth: string;
    connectingRoadWidthUnit: "Feet" | "Meter";
    amenities: Partial<Record<AmenityCategory, string[]>>;
  };
  description: {
    oneLineDescription: string;
    propertyDescription: string;
  };
};

export const INITIAL_FORM_STATE: ListPropertyFormState = {
  basicInfo: {
    listingType: null,
    buildingType: null,
    propertyType: null,
    city: "",
    locality: "",
    society: "",
    bhk: null,
    additionalSpaces: [],
    suitedFor: null,
    areaDetails: [{ areaSize: "", areaType: "Built-up Area", isDisplay: true }],
    priceAmount: "",
    priceUnit: "Per Month",
    maintenanceAmount: "",
    maintenanceUnit: "Per Month",
    maintenanceIncludedInPrice: false,
    securityDeposit: null,
  },
  configuration: {
    // These 4 have no asterisk in the reference screenshots (no required-field
    // validation gates on them), but the backend schema stores them as
    // non-nullable enums — so they ship with a sensible pre-selected default
    // instead of null, and the user can change the highlighted chip.
    availableFromType: "Immediately",
    availableFromDate: "",
    ageOfProperty: "0-1",
    bathrooms: "1",
    coveredParking: "N/A",
    openParking: "N/A",
    balcony: [],
  },
  media: {
    images: [],
    videos: [],
    flooring: "",
    towerBlock: "",
    unitNo: "",
    unitNoPrivate: false,
    highlights: [],
  },
  detailedConfig: {
    furnishingStatus: null,
    powerBackup: "No Back-up",
    facing: "",
    view: "",
    floorNumber: "",
    totalFloorCount: "",
    connectingRoadWidth: "",
    connectingRoadWidthUnit: "Feet",
    amenities: {},
  },
  description: {
    oneLineDescription: "",
    propertyDescription: "",
  },
};

export type StepErrors = Record<string, string>;
