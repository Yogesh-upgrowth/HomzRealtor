"use client";

import React, { useState } from "react";

type Amenity = {
  label: string;
  icon?: React.ReactNode;
};

type AmenitiesSectionProps = {
  title: string;
  description: string;
  amenities: Amenity[];
  initialVisible?: number; // how many to show initially
  columns?: number;
};

const AmenityItem = ({
  label,
  icon,
}: Amenity) => {
  return (
    <div className="border rounded-xl p-4 flex flex-col items-center justify-center text-center gap-2 bg-white hover:shadow-sm transition">
      <div className="text-xl">{icon || "🔹"}</div>
      <p className="text-sm text-gray-700 truncate w-full">{label}</p>
    </div>
  );
};

const getGridCols = (cols: number) => {
  const map: Record<number, string> = {
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
    5: "grid-cols-5",
    6: "grid-cols-6",
  };
  return map[cols] || "grid-cols-4";
};

const AmenitiesSection: React.FC<AmenitiesSectionProps> = ({
  title,
  description,
  amenities,
  initialVisible = 10,
  columns = 6,
}) => {
  const [showAll, setShowAll] = useState(false);

  const visibleAmenities = showAll
    ? amenities
    : amenities.slice(0, initialVisible);

  const remaining = amenities.length - initialVisible;

  return (
    <div className="w-full max-w-6xl bg-gray-50 border rounded-xl p-6">
      
      {/* Title */}
      <h2 className="text-lg font-semibold text-gray-800">
        {title}
      </h2>

      <div className="border-t my-3" />

      {/* Description */}
      <p className="text-sm text-gray-600">
        {description}{" "}
        <span
          onClick={() => setShowAll(!showAll)}
          className="underline cursor-pointer font-medium"
        >
          {showAll ? "Show Less" : "Read More"}
        </span>
      </p>

      {/* Grid */}
      <div className={`grid gap-4 mt-5 ${getGridCols(columns)}`}>
        {visibleAmenities.map((item, i) => (
          <AmenityItem key={i} {...item} />
        ))}

        {/* +More Card */}
        {!showAll && remaining > 0 && (
          <div
            onClick={() => setShowAll(true)}
            className="border rounded-xl p-4 flex flex-col items-center justify-center text-center bg-yellow-100 cursor-pointer hover:bg-yellow-200 transition"
          >
            <p className="font-semibold">+{remaining}</p>
            <p className="text-sm">More ⌄</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AmenitiesSection;