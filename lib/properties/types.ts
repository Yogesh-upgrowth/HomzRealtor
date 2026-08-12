import type { ObjectId } from "mongodb";

// Agent-submitted property listings. Private to the submitting agent's own
// dashboard for now — these do NOT feed into homz-scrape or appear on the
// public project-listing pages (that data comes from the external homz-scrape
// API). Grouped into the same 5 buckets as the wizard's steps so the Mongo
// doc, the zod schema, and the client form state all share one shape.

export type PropertyStatus = "pending" | "active" | "inactive" | "rejected" | "archived";
// pending  = just submitted or resubmitted — awaiting admin review (the default on create).
// active   = approved, live in "My Property".
// inactive = agent paused it (e.g. rented/sold).
// rejected = admin rejected it — the agent can edit and resubmit, moving it back to "pending".
// archived = admin took down a live listing, or the agent's own soft-delete.

export type ListingType = "Sale" | "Rent";
export type BuildingType = "Residential" | "Commercial";
export type PropertyType =
  | "Apartment"
  | "Villa"
  | "Plot"
  | "Builder Floor"
  | "Penthouse"
  | "Independent House"
  | "PG";
export type BHK =
  | "Studio"
  | "1RK"
  | "1BHK"
  | "1.5BHK"
  | "2BHK"
  | "2.5BHK"
  | "3BHK"
  | "3.5BHK"
  | "4BHK"
  | "5BHK"
  | "6BHK"
  | "6+BHK";
export type AdditionalSpace =
  | "Power Room"
  | "Servant Room"
  | "Study Room"
  | "Extra Room"
  | "Basement"
  | "Store Room";
export type SuitedFor = "Students" | "Working Professionals" | "Any";
export type SecurityDeposit = "Zero" | "One Month" | "Two Month" | "Other";
export type RangeChip = "N/A" | "1" | "2" | "3" | "4" | "5" | "6" | "6+";
export type BalconyType = "Connected" | "Individual" | "Room-attached";
export type PropertyHighlight =
  | "Pet Friendly"
  | "Gated Community"
  | "Smart Home"
  | "Premium Location"
  | "Corner Unit"
  | "Private Garden"
  | "Low Density Project"
  | "Quiet/Low Traffic Area"
  | "Wheelchair Accessible"
  | "Never Occupied";
export type FurnishingStatus = "Furnished" | "Semi-Furnished" | "Unfurnished";
export type PowerBackup = "No Back-up" | "Available";
export type AmenityCategory =
  | "Sports"
  | "Convenience"
  | "Safety"
  | "Leisure"
  | "Environment"
  | "Technology"
  | "Parking"
  | "WOW Amenities";

export type AreaDetail = {
  areaSize: number;
  areaType: string; // e.g. "Carpet Area" / "Built-up Area" / "Super Built-up Area" / "Plot Area"
  isDisplay: boolean; // which one is shown as the headline area on the card
};

export type PropertyImage = {
  url: string; // Vercel Blob public URL
  tag: string;
  isCover: boolean;
};

export type PropertyModeration = {
  reviewedBy: ObjectId | null; // admin/super_admin's users._id
  reviewedAt: Date | null;
  rejectionReason: string | null;
};

export type AgentPropertyDoc = {
  _id?: ObjectId;
  ownerId: ObjectId; // -> users._id
  status: PropertyStatus;
  moderation: PropertyModeration;
  createdAt: Date;
  updatedAt: Date;

  basicInfo: {
    listingType: ListingType;
    buildingType: BuildingType;
    propertyType: PropertyType;
    city: string;
    locality: string;
    society: string | null;
    coordinates: { lat: number; lng: number } | null;
    bhk: BHK;
    additionalSpaces: AdditionalSpace[];
    suitedFor: SuitedFor;
    areaDetails: AreaDetail[];
    price: { amount: number; unit: string };
    maintenance: { amount: number; unit: string; includedInPrice: boolean } | null;
    securityDeposit: SecurityDeposit | null;
  };

  configuration: {
    availableFrom: { type: "Immediately" | "Later"; date: Date | null };
    ageOfProperty: "0-1" | "2-4" | "5-7" | "8-10" | "10+";
    bathrooms: RangeChip;
    coveredParking: RangeChip;
    openParking: RangeChip;
    balcony: BalconyType[];
  };

  media: {
    images: PropertyImage[];
    video: { url: string } | null;
    flooring: string | null;
    towerBlock: string | null;
    unitNo: { value: string; keepPrivate: boolean } | null;
    highlights: PropertyHighlight[];
  };

  detailedConfig: {
    furnishingStatus: FurnishingStatus;
    powerBackup: PowerBackup;
    facing: string | null;
    view: string | null;
    floorNumber: number | null;
    totalFloorCount: number | null;
    connectingRoadWidth: { value: number; unit: "Feet" | "Meter" } | null;
    amenities: Partial<Record<AmenityCategory, string[]>>;
  };

  description: {
    oneLineDescription: string;
    propertyDescription: string;
  };
};

// Lightweight projection for the "My Property" grid — avoids shipping full
// amenities/detailedConfig for a card view. Includes the rejection reason so
// the agent can see why without opening a detail view.
export type AgentPropertyListItem = {
  id: string;
  status: PropertyStatus;
  listingType: ListingType;
  propertyType: PropertyType;
  city: string;
  locality: string;
  bhk: BHK;
  price: { amount: number; unit: string };
  coverImageUrl: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
};

// Admin-facing list projection — same shape as AgentPropertyListItem plus
// which agent owns it, since admins review submissions across all agents.
export type AdminPropertyListItem = AgentPropertyListItem & {
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
};

export type AgentPropertyDetail = {
  id: string;
  ownerId: string;
  status: PropertyStatus;
  moderation: {
    reviewedBy: string | null;
    reviewedAt: string | null;
    rejectionReason: string | null;
  };
  createdAt: string;
  updatedAt: string;
  basicInfo: AgentPropertyDoc["basicInfo"];
  configuration: Omit<AgentPropertyDoc["configuration"], "availableFrom"> & {
    availableFrom: { type: "Immediately" | "Later"; date: string | null };
  };
  media: AgentPropertyDoc["media"];
  detailedConfig: AgentPropertyDoc["detailedConfig"];
  description: AgentPropertyDoc["description"];
};

// Audit trail for admin review actions — mirrors the property_status_events
// pattern in lib/status/types.ts. "removed" covers an admin taking down an
// already-active listing later, distinct from the initial approve/reject
// cycle, kept in the same log so a listing has one place to see its full
// moderation history.
export type PropertyReviewAction = "approved" | "rejected" | "removed";

export type PropertyReviewEventDoc = {
  _id?: ObjectId;
  propertyId: ObjectId; // -> agent_properties._id
  adminId: ObjectId; // -> users._id (role="admin" | "super_admin")
  action: PropertyReviewAction;
  reason: string | null; // required for "rejected"/"removed", optional note for "approved"
  at: Date;
};

export type PropertyReviewEventView = {
  id: string;
  adminId: string;
  adminName: string;
  action: PropertyReviewAction;
  reason: string | null;
  at: string;
};
