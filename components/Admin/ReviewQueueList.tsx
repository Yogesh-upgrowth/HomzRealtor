"use client";

import { useCallback, useEffect, useState } from "react";
import { ClipboardList } from "lucide-react";
import LoadError from "@/components/Common/LoadError";
import PropertyReviewDetail from "./PropertyReviewDetail";
import type { AdminPropertyListItem } from "@/lib/properties/types";

export default function ReviewQueueList() {
  const [items, setItems] = useState<AdminPropertyListItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/properties?status=pending");
      if (!res.ok) throw new Error("Failed to load");
      const json = await res.json();
      setItems(json.properties);
    } catch {
      setError("Couldn't load the review queue.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const handleDecided = () => {
    setSelectedId(null);
    fetchQueue();
  };

  if (selectedId) {
    return (
      <div>
        <button
          onClick={() => setSelectedId(null)}
          className="mb-4 text-sm text-gray-400 hover:text-[#D9B268] transition cursor-pointer"
        >
          ← Back to queue
        </button>
        <PropertyReviewDetail propertyId={selectedId} onDecided={handleDecided} />
      </div>
    );
  }

  if (error) return <LoadError message={error} onRetry={fetchQueue} />;

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-40 rounded-[18px] border border-white/[0.08] bg-[#141416] animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="rounded-[18px] border border-white/[0.08] bg-[#141416] py-16 px-6 text-center">
        <ClipboardList size={40} className="mx-auto text-gray-600 mb-4" />
        <h3 className="text-white font-bold mb-1">Nothing to review</h3>
        <p className="text-gray-400 text-sm">New submissions will show up here.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => setSelectedId(item.id)}
          className="text-left rounded-[18px] border border-white/[0.08] bg-[#141416] p-4 hover:border-[#D9B268]/40 transition cursor-pointer"
        >
          <div className="flex flex-wrap gap-1.5 mb-2">
            <span className="rounded-full border border-white/10 px-2.5 py-0.5 text-[11px] text-gray-300">
              {item.listingType}
            </span>
            <span className="rounded-full border border-white/10 px-2.5 py-0.5 text-[11px] text-gray-300">
              {item.propertyType}
            </span>
            <span className="rounded-full border border-white/10 px-2.5 py-0.5 text-[11px] text-gray-300">
              {item.bhk}
            </span>
          </div>
          <p className="text-sm text-gray-400 mb-1">
            {item.locality}, {item.city}
          </p>
          <p className="text-lg font-bold text-[#D9B268] mb-2">
            ₹{item.price.amount.toLocaleString("en-IN")}{" "}
            <span className="text-sm font-normal text-gray-400">{item.price.unit}</span>
          </p>
          <p className="text-xs text-gray-500">By {item.ownerName}</p>
        </button>
      ))}
    </div>
  );
}
