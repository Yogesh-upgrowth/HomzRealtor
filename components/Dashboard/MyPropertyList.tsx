"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Building2 } from "lucide-react";
import LoadError from "@/components/Common/LoadError";
import PropertyListingCard from "./PropertyListingCard";
import type { AgentPropertyListItem } from "@/lib/properties/types";

const CardSkeleton = () => (
  <div className="w-full rounded-[18px] overflow-hidden border border-white/[0.08] bg-[#141416] animate-pulse">
    <div className="w-full h-[200px] bg-white/5" />
    <div className="p-4 space-y-3">
      <div className="h-4 w-1/3 bg-white/5 rounded" />
      <div className="h-4 w-2/3 bg-white/5 rounded" />
      <div className="h-6 w-1/2 bg-white/5 rounded" />
    </div>
  </div>
);

export default function MyPropertyList() {
  const [data, setData] = useState<AgentPropertyListItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/properties");
      if (!res.ok) throw new Error("Failed to load");
      const json = await res.json();
      setData(json.properties);
    } catch {
      setError("Couldn't load your listings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const handleToggleStatus = async (id: string, status: AgentPropertyListItem["status"]) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/properties/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      setData((prev) => prev && prev.map((p) => (p.id === id ? { ...p, status } : p)));
    } catch {
      toast.error("Couldn't update listing status");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this listing? This cannot be undone.")) return;
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/properties/${id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) throw new Error();
      setData((prev) => prev && prev.filter((p) => p.id !== id));
      toast.success("Listing deleted");
    } catch {
      toast.error("Couldn't delete listing");
    } finally {
      setUpdatingId(null);
    }
  };

  if (error) return <LoadError message={error} onRetry={fetchProperties} />;

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-[18px] border border-white/[0.08] bg-[#141416] py-16 px-6 text-center">
        <Building2 size={40} className="mx-auto text-gray-600 mb-4" />
        <h3 className="text-white font-bold mb-1">You haven&apos;t listed any properties yet</h3>
        <p className="text-gray-400 text-sm mb-6">Get started by listing your first property.</p>
        <Link
          href="/dashboard/list-property"
          className="inline-block rounded-xl bg-gradient-to-br from-[#F2D79B] to-[#C99A4B] px-6 py-3 font-bold text-[#1c1608] hover:brightness-105 transition"
        >
          + List a Property
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {data.map((property) => (
        <PropertyListingCard
          key={property.id}
          property={property}
          onToggleStatus={handleToggleStatus}
          onDelete={handleDelete}
          isUpdating={updatingId === property.id}
        />
      ))}
    </div>
  );
}
