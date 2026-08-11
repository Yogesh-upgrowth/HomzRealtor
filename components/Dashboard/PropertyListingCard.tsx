"use client";

import Image from "next/image";
import { Home, MapPin } from "lucide-react";
import type { AgentPropertyListItem } from "@/lib/properties/types";

const STATUS_BADGE: Record<AgentPropertyListItem["status"], string> = {
  active: "bg-green-500/15 text-green-400 border-green-500/30",
  inactive: "bg-gray-500/15 text-gray-400 border-gray-500/30",
  archived: "bg-white/10 text-gray-500 border-white/10",
};

type PropertyListingCardProps = {
  property: AgentPropertyListItem;
  onToggleStatus: (id: string, status: AgentPropertyListItem["status"]) => void;
  onDelete: (id: string) => void;
  isUpdating?: boolean;
};

export default function PropertyListingCard({
  property,
  onToggleStatus,
  onDelete,
  isUpdating,
}: PropertyListingCardProps) {
  const nextStatus = property.status === "active" ? "inactive" : "active";

  return (
    <div className="w-full rounded-[18px] overflow-hidden border border-white/[0.08] bg-[#141416]">
      <div className="relative w-full h-[200px] bg-white/5">
        {property.coverImageUrl ? (
          <Image
            src={property.coverImageUrl}
            alt={property.locality}
            fill
            unoptimized
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Home size={28} className="text-gray-600" />
          </div>
        )}
        <span
          className={`absolute top-3 left-3 rounded-full border px-2.5 py-1 text-[11px] font-bold capitalize ${STATUS_BADGE[property.status]}`}
        >
          {property.status}
        </span>
      </div>

      <div className="p-4 space-y-2">
        <div className="flex flex-wrap gap-1.5">
          <span className="rounded-full border border-white/10 px-2.5 py-0.5 text-[11px] text-gray-300">
            {property.listingType}
          </span>
          <span className="rounded-full border border-white/10 px-2.5 py-0.5 text-[11px] text-gray-300">
            {property.propertyType}
          </span>
          <span className="rounded-full border border-white/10 px-2.5 py-0.5 text-[11px] text-gray-300">
            {property.bhk}
          </span>
        </div>
        <p className="flex items-center gap-1 text-sm text-gray-400">
          <MapPin size={13} />
          {property.locality}, {property.city}
        </p>
        <p className="text-lg font-bold text-[#D9B268]">
          ₹{property.price.amount.toLocaleString("en-IN")} <span className="text-sm font-normal text-gray-400">{property.price.unit}</span>
        </p>
      </div>

      <div className="flex gap-2 p-3 border-t border-white/[0.08]">
        <button
          type="button"
          disabled={isUpdating || property.status === "archived"}
          onClick={() => onToggleStatus(property.id, nextStatus)}
          className="flex-1 rounded-xl border border-white/10 py-2 text-[13px] font-semibold text-gray-300 hover:border-[#D9B268]/40 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          Mark {nextStatus === "active" ? "Active" : "Inactive"}
        </button>
        <button
          type="button"
          disabled={isUpdating}
          onClick={() => onDelete(property.id)}
          className="flex-1 rounded-xl border border-red-500/30 py-2 text-[13px] font-semibold text-red-400 hover:bg-red-500/10 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
