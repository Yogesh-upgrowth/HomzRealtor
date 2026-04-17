"use client";

import React from "react";

type InfoItemProps = {
  icon?: React.ReactNode;
  label: string;
  value: string;
};

const InfoItem: React.FC<InfoItemProps> = ({ icon, label, value }) => {
  return (
    <div className="flex items-start gap-2">
      {icon && <div className="mt-1">{icon}</div>}
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="font-semibold text-gray-800">{value}</p>
      </div>
    </div>
  );
};

type PropertyCardProps = {
  bottomData: { label: string; value: string }[];
  columns?: number; // 👈 dynamic columns
};

const getGridCols = (cols: number) => {
  const map: Record<number, string> = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
    5: "grid-cols-5",
    6: "grid-cols-6",
  };

  return map[cols] || "grid-cols-4"; // fallback
};

const PropertyCard: React.FC<PropertyCardProps> = ({
  bottomData,
  columns = 4,
}) => {
  return (
    <div className="w-full max-w-5xl border rounded-lg p-5 bg-white shadow-sm">
      
      {/* Top */}
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xl font-semibold">
            ₹2.87 Cr - 3.51 Cr{" "}
            <span className="text-sm text-gray-500 underline cursor-pointer">
              + Charges
            </span>
          </p>
          <p className="text-gray-600 text-sm mt-1">₹15,950 Per Sq. Ft</p>
        </div>

        <button className="border border-yellow-400 text-yellow-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-yellow-50">
          Price Insights →
        </button>
      </div>

      <div className="my-4 border-t" />

      {/* Middle */}
      <div className="flex justify-between items-center">
        <div className="flex gap-10">
          <InfoItem label="Project Status" value="New Launch" />
          <InfoItem label="Possession Starting From" value="Dec 2032" />
        </div>

        <button className="border border-yellow-400 text-yellow-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-yellow-50">
          RERA Updates →
        </button>
      </div>

      <div className="my-4 border-t" />

      {/* Bottom (Dynamic Grid) */}
      <div className={`grid gap-6 ${getGridCols(columns)}`}>
        {bottomData.map((item, i) => (
          <InfoItem key={i} {...item} />
        ))}
      </div>
    </div>
  );
};

export default PropertyCard;