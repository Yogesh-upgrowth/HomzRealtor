"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Building2 } from "lucide-react";
import LoadError from "@/components/Common/LoadError";
import type { AdminPropertyListItem, PropertyStatus } from "@/lib/properties/types";

const STATUS_OPTIONS: { value: PropertyStatus | "all"; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "rejected", label: "Rejected" },
  { value: "archived", label: "Archived" },
];

const STATUS_BADGE: Record<PropertyStatus, string> = {
  pending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  active: "bg-green-500/15 text-green-400 border-green-500/30",
  inactive: "bg-gray-500/15 text-gray-400 border-gray-500/30",
  rejected: "bg-red-500/15 text-red-400 border-red-500/30",
  archived: "bg-white/10 text-gray-500 border-white/10",
};

export default function AllListingsList() {
  const [items, setItems] = useState<AdminPropertyListItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<PropertyStatus | "all">("all");
  const [city, setCity] = useState("");
  const [agentQuery, setAgentQuery] = useState("");
  const [takingDownId, setTakingDownId] = useState<string | null>(null);
  const [reasonById, setReasonById] = useState<Record<string, string>>({});

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (status !== "all") params.set("status", status);
      if (city.trim()) params.set("city", city.trim());
      const res = await fetch(`/api/admin/properties?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load");
      const json = await res.json();
      setItems(json.properties);
    } catch {
      setError("Couldn't load listings.");
    } finally {
      setLoading(false);
    }
  }, [status, city]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const visible = items?.filter((i) => {
    if (!agentQuery.trim()) return true;
    const q = agentQuery.trim().toLowerCase();
    return i.ownerName.toLowerCase().includes(q) || i.ownerEmail.toLowerCase().includes(q);
  });

  const handleTakedown = async (id: string) => {
    const reason = (reasonById[id] || "").trim();
    if (!reason) {
      toast.error("A reason is required to take down a listing");
      return;
    }
    setTakingDownId(id);
    try {
      const res = await fetch(`/api/admin/properties/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Something went wrong");
      toast.success("Listing taken down");
      setItems((prev) => prev && prev.map((i) => (i.id === id ? { ...i, status: "archived" } : i)));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setTakingDownId(null);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as PropertyStatus | "all")}
          className="rounded-xl border border-white/10 bg-[#1a1a1d] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D9B268] transition-colors"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Filter by city"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="rounded-xl border border-white/10 bg-[#1a1a1d] px-4 py-2.5 text-sm text-white placeholder:text-gray-500 outline-none focus:border-[#D9B268] transition-colors"
        />
        <input
          type="text"
          placeholder="Filter by agent name/email"
          value={agentQuery}
          onChange={(e) => setAgentQuery(e.target.value)}
          className="rounded-xl border border-white/10 bg-[#1a1a1d] px-4 py-2.5 text-sm text-white placeholder:text-gray-500 outline-none focus:border-[#D9B268] transition-colors"
        />
      </div>

      {error && <LoadError message={error} onRetry={fetchListings} />}

      {!error && loading && (
        <div className="grid grid-cols-1 gap-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-[18px] border border-white/[0.08] bg-[#141416] animate-pulse"
            />
          ))}
        </div>
      )}

      {!error && !loading && (!visible || visible.length === 0) && (
        <div className="rounded-[18px] border border-white/[0.08] bg-[#141416] py-16 px-6 text-center">
          <Building2 size={40} className="mx-auto text-gray-600 mb-4" />
          <h3 className="text-white font-bold mb-1">No listings match these filters</h3>
        </div>
      )}

      {!error && !loading && visible && visible.length > 0 && (
        <div className="flex flex-col gap-4">
          {visible.map((item) => (
            <div
              key={item.id}
              className="rounded-[18px] border border-white/[0.08] bg-[#141416] p-4 flex flex-col sm:flex-row sm:items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold capitalize ${STATUS_BADGE[item.status]}`}
                  >
                    {item.status}
                  </span>
                  <span className="text-sm text-white font-semibold">
                    {item.locality}, {item.city}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {item.listingType} · {item.propertyType} · {item.bhk} · By {item.ownerName} (
                  {item.ownerEmail})
                </p>
                <p className="text-sm font-bold text-[#D9B268] mt-1">
                  ₹{item.price.amount.toLocaleString("en-IN")}{" "}
                  <span className="text-xs font-normal text-gray-400">{item.price.unit}</span>
                </p>
              </div>
              {item.status !== "archived" && (
                <div className="flex flex-col sm:flex-row gap-2 sm:items-center w-full sm:w-auto">
                  <input
                    type="text"
                    placeholder="Takedown reason"
                    value={reasonById[item.id] || ""}
                    onChange={(e) =>
                      setReasonById((prev) => ({ ...prev, [item.id]: e.target.value }))
                    }
                    className="rounded-lg border border-white/10 bg-[#1a1a1d] px-3 py-2 text-xs text-white placeholder:text-gray-500 outline-none focus:border-[#D9B268] transition-colors sm:w-56"
                  />
                  <button
                    onClick={() => handleTakedown(item.id)}
                    disabled={takingDownId === item.id}
                    className="rounded-lg border border-red-500/30 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 transition disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    Take Down
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
