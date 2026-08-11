import type { ChipOption } from "@/components/Form/ChipGroup";
import type { AmenityCategory } from "@/lib/properties/types";

export const STEP_DEFINITIONS = [
  { step: 1, title: "Basic Info" },
  { step: 2, title: "Basic Configuration" },
  { step: 3, title: "Media & Highlights" },
  { step: 4, title: "Detailed Configuration" },
  { step: 5, title: "Description" },
] as const;

export const PROPERTY_TYPE_OPTIONS: ChipOption[] = [
  { value: "Apartment", label: "Apartment" },
  { value: "Villa", label: "Villa" },
  { value: "Plot", label: "Plot" },
  { value: "Builder Floor", label: "Builder Floor" },
  { value: "Penthouse", label: "Penthouse" },
  { value: "Independent House", label: "Independent House" },
  { value: "PG", label: "PG" },
];

export const BHK_OPTIONS: ChipOption[] = [
  { value: "Studio", label: "Studio" },
  { value: "1RK", label: "1 RK" },
  { value: "1BHK", label: "1 BHK" },
  { value: "1.5BHK", label: "1.5 BHK" },
  { value: "2BHK", label: "2 BHK" },
  { value: "2.5BHK", label: "2.5 BHK" },
  { value: "3BHK", label: "3 BHK" },
  { value: "3.5BHK", label: "3.5 BHK" },
  { value: "4BHK", label: "4 BHK" },
  { value: "5BHK", label: "5 BHK" },
  { value: "6BHK", label: "6 BHK" },
  { value: "6+BHK", label: "6+ BHK" },
];

export const ADDITIONAL_SPACE_OPTIONS: ChipOption[] = [
  { value: "Power Room", label: "Power Room" },
  { value: "Servant Room", label: "Servant Room" },
  { value: "Study Room", label: "Study Room" },
  { value: "Extra Room", label: "Extra Room" },
  { value: "Basement", label: "Basement" },
  { value: "Store Room", label: "Store Room" },
];

export const SUITED_FOR_OPTIONS: ChipOption[] = [
  { value: "Students", label: "Students" },
  { value: "Working Professionals", label: "Working Professionals" },
  { value: "Any", label: "Any" },
];

export const SECURITY_DEPOSIT_OPTIONS: ChipOption[] = [
  { value: "Zero", label: "Zero Deposit" },
  { value: "One Month", label: "One Month" },
  { value: "Two Month", label: "Two Month" },
  { value: "Other", label: "Other" },
];

export const AREA_TYPE_OPTIONS: ChipOption[] = [
  { value: "Built-up Area", label: "Built-up Area" },
  { value: "Carpet Area", label: "Carpet Area" },
  { value: "Super Built-up Area", label: "Super Built-up Area" },
  { value: "Plot Area", label: "Plot Area" },
];

export const RENT_PRICE_UNIT_OPTIONS = ["Per Month", "Per SqFt"];
export const SALE_PRICE_UNIT_OPTIONS = ["Total", "Per SqFt"];
export const MAINTENANCE_UNIT_OPTIONS = ["Per Month", "Per SqFt", "Per Year"];

export const AVAILABLE_FROM_OPTIONS: ChipOption[] = [
  { value: "Immediately", label: "Immediately" },
  { value: "Later", label: "Later" },
];

export const AGE_OF_PROPERTY_OPTIONS: ChipOption[] = [
  { value: "0-1", label: "0-1 Years" },
  { value: "2-4", label: "2-4 Years" },
  { value: "5-7", label: "5-7 Years" },
  { value: "8-10", label: "8-10 Years" },
  { value: "10+", label: "10+ Years" },
];

export const BATHROOM_OPTIONS: ChipOption[] = ["1", "2", "3", "4", "5", "6", "6+"].map((v) => ({
  value: v,
  label: v,
}));

export const PARKING_OPTIONS: ChipOption[] = ["N/A", "1", "2", "3", "4", "5", "6", "6+"].map((v) => ({
  value: v,
  label: v,
}));

export const BALCONY_OPTIONS: ChipOption[] = [
  { value: "Connected", label: "Connected" },
  { value: "Individual", label: "Individual" },
  { value: "Room-attached", label: "Room-attached" },
];

export const IMAGE_TAG_OPTIONS: ChipOption[] = [
  { value: "Exterior View", label: "Exterior View" },
  { value: "Living Room", label: "Living Room" },
  { value: "Bedroom", label: "Bedroom" },
  { value: "Kitchen", label: "Kitchen" },
  { value: "Bathroom", label: "Bathroom" },
  { value: "Balcony", label: "Balcony" },
  { value: "Floor Plan", label: "Floor Plan" },
];

export const PROPERTY_HIGHLIGHT_OPTIONS: ChipOption[] = [
  { value: "Pet Friendly", label: "Pet Friendly" },
  { value: "Gated Community", label: "Gated Community" },
  { value: "Smart Home", label: "Smart Home" },
  { value: "Premium Location", label: "Premium Location" },
  { value: "Corner Unit", label: "Corner Unit" },
  { value: "Private Garden", label: "Private Garden" },
  { value: "Low Density Project", label: "Low Density Project" },
  { value: "Quiet/Low Traffic Area", label: "Quiet/Low Traffic Area" },
  { value: "Wheelchair Accessible", label: "Wheelchair Accessible" },
  { value: "Never Occupied", label: "Never Occupied" },
];

export const FURNISHING_STATUS_OPTIONS: ChipOption[] = [
  { value: "Furnished", label: "Furnished" },
  { value: "Semi-Furnished", label: "Semi-Furnished" },
  { value: "Unfurnished", label: "Unfurnished" },
];

export const POWER_BACKUP_OPTIONS: ChipOption[] = [
  { value: "No Back-up", label: "No Back-up" },
  { value: "Available", label: "Available" },
];

export const FACING_OPTIONS = [
  "North",
  "South",
  "East",
  "West",
  "North-East",
  "North-West",
  "South-East",
  "South-West",
];

export const VIEW_OPTIONS = [
  "Park/Garden View",
  "City View",
  "Pool View",
  "Club View",
  "Main Road View",
  "Open View",
];

export const AMENITY_CATEGORIES: { category: AmenityCategory; items: ChipOption[] }[] = [
  {
    category: "Sports",
    items: [
      "Swimming Pool",
      "Gymnasium",
      "Jogging Track",
      "Tennis Court",
      "Basketball Court",
      "Badminton Court",
      "Cricket Pitch",
      "Yoga/Meditation Area",
    ].map((v) => ({ value: v, label: v })),
  },
  {
    category: "Convenience",
    items: ["Power Backup", "Lift", "ATM", "Shopping Center", "Cafeteria", "Convenience Store"].map(
      (v) => ({ value: v, label: v })
    ),
  },
  {
    category: "Safety",
    items: [
      "24x7 Security",
      "CCTV Surveillance",
      "Fire Fighting System",
      "Intercom Facility",
      "Gated Community",
    ].map((v) => ({ value: v, label: v })),
  },
  {
    category: "Leisure",
    items: ["Clubhouse", "Party Hall", "Amphitheater", "Indoor Games Room", "Library"].map((v) => ({
      value: v,
      label: v,
    })),
  },
  {
    category: "Environment",
    items: [
      "Rain Water Harvesting",
      "Landscaped Garden",
      "Sewage Treatment Plant",
      "Solar Water Heating",
    ].map((v) => ({ value: v, label: v })),
  },
  {
    category: "Technology",
    items: ["Video Door Security", "Wi-Fi Connectivity", "Smart Home Automation", "EV Charging Point"].map(
      (v) => ({ value: v, label: v })
    ),
  },
  {
    category: "Parking",
    items: ["Visitor Parking", "Covered Parking", "Reserved Parking"].map((v) => ({
      value: v,
      label: v,
    })),
  },
  {
    category: "WOW Amenities",
    items: ["Rooftop Infinity Pool", "Sky Lounge", "Golf Simulator", "Home Theater"].map((v) => ({
      value: v,
      label: v,
    })),
  },
];
