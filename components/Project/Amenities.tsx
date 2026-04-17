"use client";

import { useState } from "react";
import {
  Dumbbell,
  Waves,
  ShieldCheck,
  Camera,
  TreePine,
  Building2,
  Bike,
  HeartPulse,
  Gamepad2,
  Users,
  Zap,
  Droplets,
  ArrowUpDown,
  CreditCard,
  CircleDot,
} from "lucide-react";

type AmenityCategory = {
  category: string;
  amenities: string[];
};

type AmenitiesProps = {
  data: AmenityCategory[];
};

const Amenities = ({ data }: AmenitiesProps) => {
  const [open, setOpen] = useState(false);

  const firstCategory = data[0];
  const visibleItems = 5;

  const remainingCount =
    firstCategory.amenities.length - visibleItems;

  const getAmenityIcon = (text: string) => {
    const key = text.toLowerCase();

    if (key.includes("gym")) return Dumbbell;
    if (key.includes("pool")) return Waves;
    if (key.includes("security")) return ShieldCheck;
    if (key.includes("cctv") || key.includes("surveillance")) return Camera;
    if (key.includes("park") || key.includes("green")) return TreePine;
    if (key.includes("club")) return Building2;
    if (key.includes("cycle") || key.includes("jog")) return Bike;
    if (key.includes("yoga")) return HeartPulse;
    if (key.includes("indoor") || key.includes("games")) return Gamepad2;
    if (key.includes("kids")) return Users;
    if (key.includes("power")) return Zap;
    if (key.includes("water")) return Droplets;
    if (key.includes("lift")) return ArrowUpDown;
    if (key.includes("atm")) return CreditCard;

    return CircleDot;
  };

  return (
    <>
      {/* ===== Preview Card ===== */}
      <h2 className="bg-gradient-to-b from-[#FDF094] to-[#B77D2B] bg-clip-text text-transparent font-bold text-2xl my-3">Amenities</h2>
      <div className="bg-black border border-gray-700 rounded-xl p-5">
        <h2 className="text-xl font-semibold text-white mb-4">
          {firstCategory.category}
        </h2>

        {/* 2-column grid WITHOUT lines */}
        <div className="grid grid-cols-2 gap-y-3 text-sm text-gray-300">
          {firstCategory.amenities
            .slice(0, visibleItems)
            .map((item, index) => {
              const Icon = getAmenityIcon(item);

              return (
                <div
                  key={index}
                  className="flex items-center gap-2 px-2"
                >
                  <Icon size={16} className="text-gray-400 shrink-0" />
                  {item}
                </div>
              );
            })}

          {/* Button unchanged */}
          {remainingCount > 0 && (
            <button
              onClick={() => setOpen(true)}
              className="col-span-2 text-blue-400 font-medium pt-2 text-left"
            >
              +{remainingCount} more
            </button>
          )}
        </div>
      </div>

      {/* ===== Floating Modal ===== */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Modal */}
          <div className="relative bg-black w-[90%] max-w-5xl max-h-[80vh] rounded-2xl shadow-xl p-6 border border-gray-700">
            
            {/* Header */}
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-semibold text-white">
                Amenities
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto max-h-[65vh] pr-2 space-y-6">
              
              {data.map((category, index) => (
                <div
                  key={index}
                  className="border border-gray-700 rounded-lg p-4"
                >
                  <h3 className="font-semibold text-white mb-3">
                    {category.category}
                  </h3>

                  {/* Grid WITHOUT lines */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm text-gray-300">
                    {category.amenities.map((item, i) => {
                      const Icon = getAmenityIcon(item);

                      return (
                        <div
                          key={i}
                          className="flex items-center gap-2 hover:text-white transition-colors"
                        >
                          <Icon
                            size={16}
                            className="text-gray-400 shrink-0"
                          />
                          {item}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Amenities;